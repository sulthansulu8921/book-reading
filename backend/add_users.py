from models import SessionLocal, User
from auth import get_password_hash

def run():
    db = SessionLocal()
    
    users_to_add = [
        ('sulthan', 'sulthan'),
        ('fdhu', 'fdhu123')
    ]
    
    for u, p in users_to_add:
        # Check if they already exist
        if not db.query(User).filter(User.username == u).first():
            user = User(
                username=u, 
                password_hash=get_password_hash(p), 
                pfp_url=f'https://api.dicebear.com/7.x/avataaars/svg?seed={u}'
            )
            db.add(user)
            print(f"Created user: {u}")
        else:
            print(f"User {u} already exists.")
            
    db.commit()

if __name__ == "__main__":
    run()
