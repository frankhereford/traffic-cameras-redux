import datetime
import logging
import requests
from flask import Flask, Response, abort

# Configure logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

IMAGE_URL = "https://cctv.austinmobility.io/image/395.jpg"

@app.route('/')
def index():
    current_time = datetime.datetime.now().isoformat()
    logging.info(f"Root path accessed at {current_time}")
    return f"Current time: {current_time}"

@app.route('/<uuid:uuid>.jpg')
def get_image(uuid):
    logging.info(f"Request for image with uuid: {uuid}")
    try:
        response = requests.get(IMAGE_URL, timeout=5)
        response.raise_for_status()  # Raise an exception for bad status codes
        return Response(response.content, mimetype=response.headers['Content-Type'])
    except requests.exceptions.RequestException as e:
        logging.error(f"Error downloading image: {e}")
        abort(502) # Bad Gateway

@app.errorhandler(404)
def page_not_found(e):
    return "Not Found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 