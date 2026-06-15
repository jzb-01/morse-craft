from flask import Flask, render_template, request, session, redirect, jsonify, flash
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Archive, User, Note, Comment
from data import preview_table, letters, numbers, symbols
import re

app = Flask(__name__)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///morse.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)




# =====================================================================
# HELPER FUNCTION
# =====================================================================

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# =====================================================================
# PAGE RENDERING ROUTES
# =====================================================================

@app.route("/")
def index():
    return render_template("index.html", preview_table=preview_table)

@app.route("/translator")
def translator():
    return render_template("translator.html")

@app.route("/telegraph")
def telegraph():

    logged_in = session.get("user_id") is not None
    
    return render_template("telegraph.html", logged_in = logged_in)

@app.route("/training")
def training():
    return render_template("training.html")

@app.route("/codebook")
def codebook():
    return render_template("codebook.html", letters_dict=letters)

@app.route("/auth")
def auth():
    return render_template("auth.html")

@app.route("/notes")
def notes():

    user_id = session.get("user_id")

    if not user_id:
        return render_template(
            "notes.html",
            notes=[]
        )

    notes = (
        Note.query
        .filter_by(user_id=user_id)
        .order_by(Note.created_at.desc())
        .all()
    )

    return render_template(
        "notes.html",
        notes=notes
    )

@app.route("/archive")
def archive():
    archives = Archive.query.all()
    return render_template("archive.html", archives=archives)

@app.route("/comments")
def comments():
    # Fetching comments from the updated Comment model
    comments = Comment.query.all()
    return render_template("comments.html", comments=comments)



# =====================================================================
# AUTHENTICATION PAGES
# =====================================================================


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    password = request.form.get("password")

    user = User.query.filter_by(username=username).first()

    if not user:
        flash("Unknown username.")
        return redirect("/auth")

    if not check_password_hash(user.password_hash, password):
        flash("Incorrect password.")
        return redirect("/auth")

    session["user_id"] = user.id
    return redirect("/account")

@app.route("/register", methods=["POST"])
def register():
    username = request.form.get("username")
    email = request.form.get("email")
    password = request.form.get("password")

    # Validate inputs
    if not username or not email or not password:
        flash("All fields are required.")
        return redirect("/auth")
    
    if len(username) < 3:
        flash("Username must be at least 3 characters.")
        return redirect("/auth")
    
    if len(password) < 6:
        flash("Password must be at least 6 characters.")
        return redirect("/auth")
    
    if not is_valid_email(email):
        flash("Invalid email format.")
        return redirect("/auth")

    # Check existing user
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        flash("Username already exists.")
        return redirect("/auth")

    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        flash("Email already exists.")
        return redirect("/auth")

    # Create user
    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password)
    )

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id
    return redirect("/account")

@app.route("/account")
def account():

    user_id = session.get("user_id")

    if not user_id:
        return redirect("/auth")

    user = User.query.get_or_404(user_id)

    notes_count = Note.query.filter_by(
        user_id=user.id
    ).count()

    comments_count = Comment.query.filter_by(
        user_id=user.id
    ).count()

    return render_template(
        "account.html",
        user=user,
        notes_count=notes_count,
        comments_count=comments_count
    )

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/auth")


# =====================================================================
# API / DATA ENDPOINTS (JSON Responses)
# =====================================================================


@app.route("/api/codebook/<string:codebook>")
def codebook_api(codebook):
    if codebook == "letters":
        return letters
    elif codebook == "numbers":
        return numbers
    return symbols

@app.route("/api/archive/<int:archive_id>")
def archive_api(archive_id):
    archive = Archive.query.get_or_404(archive_id)
    return {
        "title": archive.title,
        "content": archive.content
    }

@app.route("/api/note/<int:note_id>")
def note_api(note_id):

    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "error": "Unauthorized"
        }), 401

    note = Note.query.get_or_404(note_id)

    if note.user_id != user_id:
        return jsonify({
            "error": "Forbidden"
        }), 403

    return {
        "title": f"NOTE #{note.id}",
        "content": note.content,
        "id": note.id
    }

@app.route(
    "/api/notedelete/<int:note_id>",
    methods=["DELETE"]
)
def delete_note(note_id):

    user_id = session.get(
        "user_id"
    )

    if not user_id:
        return {
            "error":
            "Unauthorized"
        }, 401

    note = (
        Note.query
        .get_or_404(note_id)
    )

    if note.user_id != user_id:

        return {
            "error":
            "Forbidden"
        }, 403

    db.session.delete(note)

    db.session.commit()

    return {
        "success": True
    }

@app.route(
    "/api/notes",
    methods=["POST"]
)
def create_note():

    user_id = session.get("user_id")

    if not user_id:
        return {
            "error": "Login required"
        }, 401

    data = request.get_json()

    content = (
        data.get("content", "")
        .strip()
    )

    if not content:
        return {
            "error": "Empty note"
        }, 400

    note = Note(
        user_id=user_id,
        content=content,
        length=len(content)
    )

    db.session.add(note)
    db.session.commit()

    return {
        "success": True
    }

@app.route("/api/comments/<int:comment_id>")
def comments_api(comment_id):
    comment_entry = Comment.query.get_or_404(comment_id)
    user_id = session.get("user_id")

    author_name = comment_entry.author.username if comment_entry.author else "Unknown Author"

    return {
        "author": author_name,
        "content": comment_entry.content,
        "id": comment_entry.id,
        "can_delete": (
            user_id is not None and
            comment_entry.user_id == user_id
        )        
    }


@app.route(
    "/api/comment",
    methods=["POST"]
)
def create_comment():

    user_id = session.get("user_id")

    if not user_id:
        return {
            "error": "Login required"
        }, 401

    data = request.get_json()

    content = (
        data.get("content", "")
        .strip()
    )

    if not content:
        return {
            "error": "Empty comment"
        }, 400

    comment = Comment(
        user_id=user_id,
        content=content,
        length=len(content)
    )

    db.session.add(comment)
    db.session.commit()

    return {
        "success": True
    }

@app.route(
    "/api/commentdelete/<int:comment_id>",
    methods=["DELETE"]
)
def delete_comment(comment_id):

    user_id = session.get("user_id")

    if not user_id:
        return {"error": "Unauthorized"}, 401

    comment = Comment.query.get_or_404(
        comment_id
    )

    if comment.user_id != user_id:
        return {"error": "Forbidden"}, 403

    db.session.delete(comment)
    db.session.commit()

    return {"success": True}

# =====================================================================
# APPLICATION LAUNCH
# =====================================================================
if __name__ == '__main__':
    app.run()