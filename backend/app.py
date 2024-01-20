from flask import Flask, jsonify
from flask_cors import CORS, cross_origin
from rymscraper import scraper

app = Flask(__name__)
CORS(app)
rymscraper = scraper.Scraper()

@app.route('/')
def index():
    return "Hello World, This is the Index."

@app.route('/<name>')
def print_name(name):
    return f'Hi, {name}'

@app.route('/artists/<artist>')
@cross_origin()
def get_artist_info(artist):
    return jsonify(rymscraper.get_artist_info(artist))

if __name__ == "__main__":
    app.run(debug=True)