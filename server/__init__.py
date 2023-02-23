from flask import Flask, render_template, url_for

class Project:
    def __init__(self, image, title, about, date, link):
        self.image = image
        self.title = title
        self.about = about
        self.date = date
        self.link = link

def create_app():
    app = Flask(__name__, template_folder='./templates')

    @app.route('/')
    def index():
        projects = list()

        projects.append(Project('none',
            'Yell',
            "Yell is a peer-to-peer network protocol created for real-time "\
            "interactions in video-games.",
            'February, 2023',
            'https://github.com/micahdbak/yell'))
        projects.append(Project('none',
            'Threads',
            "Threads is a forum created for the nwHacks 2023 hackathon. "\
            "Threads' database is written entirely in C, and communicates "\
            "to a Python Flask server through network sockets.",
            'January, 2023',
            'https://github.com/micahdbak/nwhacks2023'))
        projects.append(Project('none',
            'qsim',
            "qsim is a program that estimates the trajectories of particles "\
            "with respect to electromagnetic and gravitational forces.",
            'June, 2022',
            'https://github.com/micahdbak/qsim'))

        return render_template('index.html', projects = projects)

    return app
