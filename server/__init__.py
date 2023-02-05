from flask import Flask, render_template

class Button:
    def __init__(self, url, title):
        self.url = url
        self.title = title

def create_app ():
    app = Flask(__name__, template_folder='./templates')

    @app.route('/')
    def index():
        buttons = list()

        buttons.append(Button('/', 'Home'))
        buttons.append(Button('/projects', 'Projects'))
        buttons.append(Button('https://linkedin.com/in/micahdbak', 'LinkedIn'))
        buttons.append(Button('https://github.com/micahdbak', 'GitHub'))

        return render_template('index.html', buttons=buttons, nbuttons=len(buttons))

    return app
