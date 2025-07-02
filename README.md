# Tgbh Project
=====================================

## Project Title and Description
An AI-powered voice assistant project that utilizes natural language processing and machine learning to provide a conversational interface. It integrates with various APIs and services to fetch data, translate text, and parse documents. This project is designed to assist users in extracting information from documents and providing a user-friendly interface for tasks such as language translation and document parsing.

## Features
---------------

* Conversational interface using Flask and SocketIO
* Natural language processing using langchain_prompts and langchain_memory
* Machine learning integration for document parsing and translation
* Integration with various APIs for data fetching and translation
* User-friendly interface for tasks such as language translation and document parsing

## Technology Stack
-------------------

* Programming Languages: Python
* Frameworks: Flask, Flask-SocketIO, langchain_prompts, langchain_memory, langchain_chains, Flask-PyMongo
* Libraries: langchain_output_parsers, langchain_groq, Flask-Cors, Flask-PyMongo, pandas, numpy, requests, xml.etree.ElementTree
* Database: MongoDB

## Prerequisites
----------------

* Python 3.8 or higher
* pip package manager
* MongoDB installed and running
* SARVAM API key and GROQ API key environment variables set

## Installation
---------------

### Clone the repository

```bash
git clone https://github.com/Pratz1337/BengaluruHack.git
```

### Install dependencies

```bash
pip install -r backend/requirements.txt
pip install -r frontend/requirements.txt
```

### Set environment variables

Create a `.env` file in the root directory and add the following environment variables:

```bash
SARVAM_API_KEY=YOUR_SARVAM_API_KEY
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

### Run the application

```bash
cd backend
python app.py
```

### Run the frontend

```bash
cd frontend
npm start
```

## Usage
---------

### Run the application

To run the application, navigate to the `backend` directory and execute the following command:

```bash
python app.py
```

This will start the Flask development server.

### Interact with the application

To interact with the application, navigate to `http://localhost:5000` in your web browser or use a tool like curl to send requests to the API.

### API Endpoints

The application exposes the following API endpoints:

* `/`: Returns a welcome message
* `/translate`: Translates text from one language to another
* `/parse`: Parses a document and extracts relevant information

### Example Use Cases

* To translate text from English to Spanish, send a POST request to `/translate` with the following JSON payload:

```json
{
    "text": "Hello, how are you?",
    "source_language": "en",
    "target_language": "es"
}
```

* To parse a document and extract relevant information, send a POST request to `/parse` with the following JSON payload:

```json
{
    "document": "This is a sample document."
}
```

## Project Structure
---------------------

The project is organized into the following directories:

* `backend`: Contains the Flask application code
* `frontend`: Contains the React frontend code
* `vector`: Contains the vector search code
* `voice-service`: Contains the voice service code

## Configuration
--------------

The application uses the following configuration files:

* `.env`: Contains environment variables
* `config.ts`: Contains frontend configuration

## API Documentation
--------------------

The application exposes the following API endpoints:

* `/`: Returns a welcome message
* `/translate`: Translates text from one language to another
* `/parse`: Parses a document and extracts relevant information

## Contributing
--------------

Contributions are welcome! Please fork the repository and submit a pull request with the following information:

* A clear description of the changes made
* Any relevant documentation or API changes

## License
---------

This project is licensed under the MIT License.

## Contact
---------

Author: Your Name
Maintainer: Your Email Address

Note: This README file is a sample and should be modified to fit the specific needs of your project.
