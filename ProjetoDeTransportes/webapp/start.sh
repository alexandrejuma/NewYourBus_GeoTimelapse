#!/usr/bin/env bash

gunicorn --bind=0.0.0.0:5000 --keep-alive=2000 \
    --timeout=2000 --log-level=debug  --reload \
    flaskbusapp:app
