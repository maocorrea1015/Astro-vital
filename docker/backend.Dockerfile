FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=5000

WORKDIR /app
COPY Backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY Backend/ ./
COPY docker/init_backend.py /opt/astra/init_backend.py
RUN mkdir -p /app/data

EXPOSE 5000
CMD ["sh", "-c", "python /opt/astra/init_backend.py && python app.py"]
