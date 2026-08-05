from app.db.session import SessionLocal
from app.models.all_models import User
from app.core.security import hash_password

def seed_database():
    db = SessionLocal()

    admin_exists = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin_exists:
        admin_user = User(
            email="admin@example.com",
            hashed_password=hash_password("adminpassword"),
            full_name="Admin User",
            role="ADMIN",
            status="ACTIVE"
        )
        db.add(admin_user)

    instructor_exists = db.query(User).filter(User.email == "instructor@example.com").first()
    if not instructor_exists:
        instructor_user = User(
            email="instructor@example.com",
            hashed_password=hash_password("instructorpassword"),
            full_name="Teacher User",
            role="INSTRUCTOR",
            status="ACTIVE"
        )
        db.add(instructor_user)

    db.commit()
    db.close()
    print("Database seeded with initial users.")

if __name__ == "__main__":
    seed_database()