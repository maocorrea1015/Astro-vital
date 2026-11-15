FROM python:3.12-slim
WORKDIR /app
COPY script/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY script/simulator.py ./simulator.py
CMD ["sh", "-c", "python simulator.py --host \"$ASTRA_BACKEND_URL\" --api-key \"$ASTRA_API_KEY\" --interval \"$ASTRA_SIMULATOR_INTERVAL\" --mode \"$ASTRA_SIMULATOR_MODE\" --astronaut-id \"$ASTRA_ASTRONAUT_ID\""]
