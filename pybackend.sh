#!/bin/bash

source .venv/bin/activate
pip install -r requirements.txt
cd pybackend
uvicorn main:app --reload --host 0.0.0.0 --port 12345
