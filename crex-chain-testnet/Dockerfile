FROM ghcr.io/foundry-rs/foundry:latest

USER root
WORKDIR /app

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && mkdir -p /data

EXPOSE 8545

ENTRYPOINT ["/app/entrypoint.sh"]
