import fs from "fs";
import path from "path";
import { sql } from "@vercel/postgres";
import { LOCK_MULTIPLIERS, LockPlan } from "@/lib/config";
import { getAccruedPboxc, getDaysElapsed, getMaturityTs, isClaimable } from "@/lib/rewards";
import type { DerivedPosition, Position, TxRecord } from "@/types";
import {
  DEFAULT_STAKING_SETTINGS,
  normalizeStakingSettings,
  StakingSettings,
} from "@/lib/stakingSettings";

type DbStats = { tvl: number; totalStakers: number; totalDistributed: number };

type CreatePositionArgs = {
  wallet_address: string;
  amount_sol: number;
  lock_plan: LockPlan;
  start_ts?: number;
  tx_signature?: string | null;
};

type DbApi = {
  createPosition(args: CreatePositionArgs): Promise<Position>;
  listPositionsByWallet(wallet: string): Promise<DerivedPosition[]>;
  listRecentVerifiedPositions(limit?: number): Promise<Position[]>;
  getPositionById(id: string): Promise<Position | null>;
  findPositionBySignature(signature: string): Promise<Position | null>;
  markClaimed(id: string, claimedAmount: number): Promise<Position | null>;
  addTx(tx: TxRecord): Promise<void>;
  findTxBySignature(signature: string): Promise<TxRecord | null>;
  stats(): Promise<DbStats>;
  getSettings(): Promise<StakingSettings>;
  updateSettings(settings: StakingSettings): Promise<StakingSettings>;
};

const postgresConfigured =
  !!process.env.POSTGRES_URL ||
  !!process.env.POSTGRES_PRISMA_URL ||
  !!process.env.POSTGRES_URL_NON_POOLING;

if (process.env.VERCEL === "1" && !postgresConfigured) {
  console.warn(
    "[db] POSTGRES_URL not configured - data will reset between deployments. Configure Vercel Postgres or set ENABLE_FILE_DB=true to persist locally."
  );
}

const usePostgres = postgresConfigured;

export const db: DbApi = usePostgres ? createPostgresDb() : createFileDb();

/**
 * Postgres-backed implementation using Vercel Postgres (Neon).
 */
function createPostgresDb(): DbApi {
  let tablesReady: Promise<void> | null = null;

  const ensureTables = () => {
    if (!tablesReady) {
      tablesReady = (async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS positions (
            id TEXT PRIMARY KEY,
            wallet_address TEXT NOT NULL,
            amount_sol NUMERIC NOT NULL,
            lock_plan TEXT NOT NULL,
            lock_multiplier NUMERIC NOT NULL,
            start_ts BIGINT NOT NULL,
            maturity_ts BIGINT NOT NULL,
            status TEXT NOT NULL,
            claimed_pboxc NUMERIC NOT NULL,
            tx_signature TEXT UNIQUE
          );
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS txs (
            id SERIAL PRIMARY KEY,
            wallet_address TEXT NOT NULL,
            type TEXT NOT NULL,
            tx_sig TEXT UNIQUE,
            ts BIGINT NOT NULL,
            meta JSONB
          );
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS app_settings (
            id TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            updated_at BIGINT NOT NULL
          );
        `;
      })();
    }
    return tablesReady;
  };

  const mapPositionRow = (row: any): Position => ({
    id: row.id,
    wallet_address: row.wallet_address,
    amount_sol: Number(row.amount_sol),
    lock_plan: row.lock_plan,
    lock_multiplier: Number(row.lock_multiplier),
    start_ts: Number(row.start_ts),
    maturity_ts: Number(row.maturity_ts),
    status: row.status,
    claimed_pboxc: Number(row.claimed_pboxc),
    tx_signature: row.tx_signature ?? null,
  });

  const mapTxRow = (row: any): TxRecord => ({
    wallet_address: row.wallet_address,
    type: row.type,
    tx_sig: row.tx_sig ?? undefined,
    ts: Number(row.ts),
    meta: row.meta ?? undefined,
  });

  return {
    async createPosition(args) {
      await ensureTables();
      const settings = await this.getSettings();
      const start_ts = args.start_ts ?? Math.floor(Date.now() / 1000);
      const maturity_ts = getMaturityTs(start_ts, args.lock_plan);
      const lock_multiplier = settings.multipliers[args.lock_plan];
      const id = generateId();

      if (args.tx_signature) {
        const existing = await sql`
          SELECT * FROM positions WHERE tx_signature = ${args.tx_signature} LIMIT 1;
        `;
        if (existing.rowCount && existing.rows[0]) {
          return mapPositionRow(existing.rows[0]);
        }
      }

      const inserted = await sql`
        INSERT INTO positions (id, wallet_address, amount_sol, lock_plan, lock_multiplier, start_ts, maturity_ts, status, claimed_pboxc, tx_signature)
        VALUES (${id}, ${args.wallet_address}, ${args.amount_sol}, ${args.lock_plan}, ${lock_multiplier}, ${start_ts}, ${maturity_ts}, 'active', 0, ${args.tx_signature ?? null})
        ON CONFLICT (tx_signature) DO NOTHING
        RETURNING *;
      `;

      if (inserted.rowCount && inserted.rows[0]) {
        return mapPositionRow(inserted.rows[0]);
      }

      // Insert skipped due to conflict, fetch again
      if (args.tx_signature) {
        const res = await sql`SELECT * FROM positions WHERE tx_signature = ${args.tx_signature} LIMIT 1;`;
        if (res.rowCount && res.rows[0]) return mapPositionRow(res.rows[0]);
      }
      throw new Error("Failed to create position");
    },

    async listPositionsByWallet(wallet) {
      await ensureTables();
      const settings = await this.getSettings();
      const res = await sql`
        SELECT * FROM positions WHERE wallet_address = ${wallet} ORDER BY start_ts DESC;
      `;
      let now = Math.floor(Date.now() / 1000);
      try {
        const { getDemoNow } = require("@/app/api/demo/cron/route");
        now = getDemoNow();
      } catch {}
      return res.rows.map(mapPositionRow).map(p => ({
        ...p,
        days_elapsed: getDaysElapsed(p.start_ts, p.lock_plan, now),
        accrued_pboxc: getAccruedPboxc(
          p.amount_sol,
          p.lock_plan,
          p.start_ts,
          now,
          p.lock_multiplier,
          settings.baseRate,
        ),
        claimable: isClaimable(p.start_ts, p.lock_plan, now),
      }));
    },

    async listRecentVerifiedPositions(limit = 20) {
      await ensureTables();
      const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
      const res = await sql`
        SELECT p.*
        FROM positions p
        INNER JOIN txs t ON t.tx_sig = p.tx_signature AND t.type = 'deposit'
        WHERE p.tx_signature IS NOT NULL
        ORDER BY p.start_ts DESC
        LIMIT ${safeLimit};
      `;
      return res.rows.map(mapPositionRow);
    },

    async getPositionById(id) {
      await ensureTables();
      const res = await sql`SELECT * FROM positions WHERE id = ${id} LIMIT 1;`;
      return res.rowCount ? mapPositionRow(res.rows[0]) : null;
    },

    async findPositionBySignature(signature) {
      await ensureTables();
      const res = await sql`SELECT * FROM positions WHERE tx_signature = ${signature} LIMIT 1;`;
      return res.rowCount ? mapPositionRow(res.rows[0]) : null;
    },

    async markClaimed(id, claimedAmount) {
      await ensureTables();
      const res = await sql`
        UPDATE positions
        SET status = 'claimed',
            claimed_pboxc = ${claimedAmount}
        WHERE id = ${id}
        RETURNING *;
      `;
      return res.rowCount ? mapPositionRow(res.rows[0]) : null;
    },

    async addTx(tx) {
      await ensureTables();
      const metaJson = tx.meta ? JSON.stringify(tx.meta) : null;
      await sql`
        INSERT INTO txs (wallet_address, type, tx_sig, ts, meta)
        VALUES (${tx.wallet_address}, ${tx.type}, ${tx.tx_sig ?? null}, ${tx.ts}, ${metaJson})
        ON CONFLICT (tx_sig) DO NOTHING;
      `;
    },

    async findTxBySignature(signature) {
      await ensureTables();
      if (!signature) return null;
      const res = await sql`SELECT * FROM txs WHERE tx_sig = ${signature} LIMIT 1;`;
      return res.rowCount ? mapTxRow(res.rows[0]) : null;
    },

    async stats() {
      await ensureTables();
      const res = await sql`
        SELECT
          COALESCE(SUM(CASE WHEN status <> 'claimed' THEN amount_sol ELSE 0 END), 0) AS tvl,
          COUNT(DISTINCT wallet_address) AS total_stakers,
          COALESCE(SUM(CASE WHEN status = 'claimed' THEN claimed_pboxc ELSE 0 END), 0) AS total_distributed
        FROM positions;
      `;
      const row = res.rows[0] ?? { tvl: 0, total_stakers: 0, total_distributed: 0 };
      return {
        tvl: Number(row.tvl ?? 0),
        totalStakers: Number(row.total_stakers ?? 0),
        totalDistributed: Number(row.total_distributed ?? 0),
      };
    },

    async getSettings() {
      await ensureTables();
      const result = await sql`SELECT value, updated_at FROM app_settings WHERE id = 'staking' LIMIT 1;`;
      if (!result.rowCount || !result.rows[0]) return DEFAULT_STAKING_SETTINGS;
      return normalizeStakingSettings({
        ...result.rows[0].value,
        updatedAt: Number(result.rows[0].updated_at),
      });
    },

    async updateSettings(settings) {
      await ensureTables();
      const normalized = normalizeStakingSettings(settings);
      const updatedAt = Math.floor(Date.now() / 1000);
      const value = JSON.stringify({ ...normalized, updatedAt });
      await sql`
        INSERT INTO app_settings (id, value, updated_at)
        VALUES ('staking', ${value}::jsonb, ${updatedAt})
        ON CONFLICT (id)
        DO UPDATE SET value = ${value}::jsonb, updated_at = ${updatedAt};
      `;
      return { ...normalized, updatedAt };
    },
  };
}

/**
 * File-backed implementation for local development (original behaviour).
 */
function createFileDb(): DbApi {
  const shouldPersistToDisk =
    process.env.ENABLE_FILE_DB === "true" || process.env.VERCEL !== "1";
  const resolvedStorePath = process.env.DATA_STORE_PATH ?? "data/storage.json";
  const DB_FILE = shouldPersistToDisk
    ? path.resolve(process.cwd(), resolvedStorePath)
    : null;
  const DATA_DIR = DB_FILE ? path.dirname(DB_FILE) : null;

  type DbState = { positions: Position[]; txs: TxRecord[]; settings: StakingSettings };

  const loadState = (): DbState => {
    if (!DB_FILE) return { positions: [], txs: [], settings: DEFAULT_STAKING_SETTINGS };
    if (!fs.existsSync(DB_FILE)) return { positions: [], txs: [], settings: DEFAULT_STAKING_SETTINGS };
    try {
      const contents = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(contents);
      const positions = Array.isArray(parsed?.positions)
        ? (parsed.positions.map(normalizePosition).filter(Boolean) as Position[])
        : [];
      const txs = Array.isArray(parsed?.txs)
        ? (parsed.txs.map(normalizeTx).filter(Boolean) as TxRecord[])
        : [];
      return {
        positions,
        txs,
        settings: normalizeStakingSettings(parsed?.settings),
      };
    } catch (e) {
      console.error("[db] Failed to load storage.json, starting fresh", e);
      return { positions: [], txs: [], settings: DEFAULT_STAKING_SETTINGS };
    }
  };

  const state: DbState = loadState();

  function persist() {
    if (!DB_FILE || !DATA_DIR) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
    } catch (e) {
      console.error("[db] Failed to persist storage.json", e);
    }
  }

  return {
    async createPosition(args) {
      const settings = await this.getSettings();
      const start_ts = args.start_ts ?? Math.floor(Date.now() / 1000);
      const maturity_ts = getMaturityTs(start_ts, args.lock_plan);
      const lock_multiplier = settings.multipliers[args.lock_plan];
      if (args.tx_signature) {
        const existing = state.positions.find(p => p.tx_signature === args.tx_signature);
        if (existing) return existing;
      }
      const p: Position = {
        id: generateId(),
        wallet_address: args.wallet_address,
        amount_sol: args.amount_sol,
        lock_plan: args.lock_plan,
        lock_multiplier,
        start_ts,
        maturity_ts,
        status: "active",
        claimed_pboxc: 0,
        tx_signature: args.tx_signature ?? null,
      };
      state.positions.push(p);
      persist();
      return p;
    },

    async listPositionsByWallet(wallet) {
      const settings = await this.getSettings();
      let now = Math.floor(Date.now() / 1000);
      try {
        const { getDemoNow } = require("@/app/api/demo/cron/route");
        now = getDemoNow();
      } catch {}
      return state.positions
        .filter(p => p.wallet_address === wallet)
        .map(p => ({
          ...p,
          days_elapsed: getDaysElapsed(p.start_ts, p.lock_plan, now),
          accrued_pboxc: getAccruedPboxc(
            p.amount_sol,
            p.lock_plan,
            p.start_ts,
            now,
            p.lock_multiplier,
            settings.baseRate,
          ),
          claimable: isClaimable(p.start_ts, p.lock_plan, now),
        }));
    },

    async listRecentVerifiedPositions(limit = 20) {
      const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
      return [...state.positions]
        .filter(position =>
          !!position.tx_signature &&
          state.txs.some(tx =>
            tx.type === "deposit" &&
            tx.tx_sig === position.tx_signature
          )
        )
        .sort((a, b) => b.start_ts - a.start_ts)
        .slice(0, safeLimit);
    },

    async getPositionById(id) {
      return state.positions.find(p => p.id === id) ?? null;
    },

    async findPositionBySignature(signature) {
      if (!signature) return null;
      return state.positions.find(p => p.tx_signature === signature) ?? null;
    },

    async markClaimed(id, claimedAmount) {
      const p = state.positions.find(x => x.id === id);
      if (!p) return null;
      p.status = "claimed";
      p.claimed_pboxc = claimedAmount;
      persist();
      return p;
    },

    async addTx(tx) {
      if (tx.tx_sig && state.txs.some(existing => existing.tx_sig === tx.tx_sig)) {
        return;
      }
      state.txs.push(tx);
      persist();
    },

    async findTxBySignature(signature) {
      if (!signature) return null;
      return state.txs.find(t => t.tx_sig === signature) ?? null;
    },

    async stats() {
      const tvl = state.positions.filter(p => p.status !== "claimed").reduce((sum, p) => sum + p.amount_sol, 0);
      const totalStakers = new Set(state.positions.map(p => p.wallet_address)).size;
      const totalDistributed = state.positions
        .filter(p => p.status === "claimed")
        .reduce((sum, p) => sum + p.claimed_pboxc, 0);
      return { tvl, totalStakers, totalDistributed };
    },

    async getSettings() {
      return normalizeStakingSettings(state.settings);
    },

    async updateSettings(settings) {
      state.settings = {
        ...normalizeStakingSettings(settings),
        updatedAt: Math.floor(Date.now() / 1000),
      };
      persist();
      return state.settings;
    },
  };
}

function normalizePosition(raw: any): Position | null {
  if (!raw) return null;
  const wallet = typeof raw.wallet_address === "string" ? raw.wallet_address : String(raw.wallet_address ?? "");
  if (!wallet) return null;
  const candidate = typeof raw.lock_plan === "string" ? raw.lock_plan : null;
  const lock_plan = (candidate && candidate in LOCK_MULTIPLIERS ? candidate : "1m") as LockPlan;
  const start_ts = Number(raw.start_ts ?? Math.floor(Date.now() / 1000));
  const maturity_ts = Number(raw.maturity_ts ?? getMaturityTs(start_ts, lock_plan));
  const lock_multiplier =
    typeof raw.lock_multiplier === "number" ? raw.lock_multiplier : LOCK_MULTIPLIERS[lock_plan] ?? 1;
  const status: Position["status"] =
    raw.status === "claimed" || raw.status === "matured" ? raw.status : "active";
  return {
    id: typeof raw.id === "string" ? raw.id : generateId(),
    wallet_address: wallet,
    amount_sol: Number(raw.amount_sol ?? 0),
    lock_plan,
    lock_multiplier,
    start_ts,
    maturity_ts,
    status,
    claimed_pboxc: Number(raw.claimed_pboxc ?? 0),
    tx_signature: raw.tx_signature ? String(raw.tx_signature) : raw.tx_sig ? String(raw.tx_sig) : null,
  };
}

function normalizeTx(raw: any): TxRecord | null {
  if (!raw) return null;
  const wallet = typeof raw.wallet_address === "string" ? raw.wallet_address : String(raw.wallet_address ?? "");
  if (!wallet) return null;
  const type = raw.type === "claim" || raw.type === "restake" ? raw.type : "deposit";
  return {
    wallet_address: wallet,
    type,
    tx_sig: raw.tx_sig ? String(raw.tx_sig) : raw.tx_signature ? String(raw.tx_signature) : undefined,
    ts: Number(raw.ts ?? Math.floor(Date.now() / 1000)),
    meta: typeof raw.meta === "object" && raw.meta ? raw.meta : undefined,
  };
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
