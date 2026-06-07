from app import app
from models import db, Archive, User, Note, Comment
from werkzeug.security import generate_password_hash
from data import conversion_table, archives, users, notes, comments

def turnMorse(content):
    return " ".join(conversion_table.get(char.upper(), "#") for char in content)


with app.app_context():
    print("Nuking old database data...")
    db.drop_all()
    
    print("Creating fresh database structure...")
    db.create_all()

    print("Seeding archives...")
    for data in archives:
        archive = Archive(
            title=data["title"],
            description=data["description"],
            content=turnMorse(data["content"]),
            fictional_date=data["fictional_date"],
            tags=data["tags"],
            length=len(turnMorse(data["content"]))
        )
        db.session.add(archive)

    print("Seeding users...")
    for data in users:
        user = User(
            username=data["username"],
            email=data["email"],
            password_hash=generate_password_hash(data["password"])
        )
        db.session.add(user)

    print("Seeding notes...")
    for data in notes:
        note = Note(
            user_id=data["user_id"],
            content=turnMorse(data["content"]),
            length=len(turnMorse(data["content"])),
        )
        db.session.add(note)

    print("Seeding comments...")
    for data in comments:
        comment = Comment(
            user_id=data["user_id"],
            content=turnMorse(data["content"]),
            length=len(turnMorse(data["content"])),
        )
        db.session.add(comment)
    
    db.session.commit()
    print("💥 Database successfully wiped, rebuilt, and re-seeded!")