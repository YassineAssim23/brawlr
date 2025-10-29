import firebase_admin
from firebase_admin import credentials, firestore
import os
from pathlib import Path

# Get the service account key path from environment variable
# Falls back to default location if not set
SERVICE_ACCOUNT_KEY = os.getenv(
    'FIREBASE_SERVICE_ACCOUNT_PATH',
    str(Path(__file__).parent / 'brawlr-database-firebase-adminsdk-fbsvc-dfb1cf6eef.json')
)

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY)
    firebase_admin.initialize_app(cred)

db = firestore.client()

async def save_or_update_score(username: str, new_score: int):
    """
    Saves a new score or updates the best score for an existing user.
    Uses a Firestore Transaction for atomicity and correctness.
    """
    username = username.strip()
    if not username:
        raise ValueError("Username cannot be empty")

    user_ref = db.collection('leaderboard').document(username.lower())

    @firestore.transactional
    def update_in_transaction(transaction, user_ref, new_score):
        snapshot = user_ref.get(transaction=transaction)
        
        current_score = snapshot.get('score') if snapshot.exists else 0
        
        if new_score > current_score or not snapshot.exists:
            transaction.set(user_ref, {
                'username': username,
                'score': new_score,
                'timestamp': firestore.SERVER_TIMESTAMP,
            })
            return True, current_score, new_score
        else:
            return False, current_score, new_score

    try:
        is_updated, old_score, new_score = update_in_transaction(db.transaction(), user_ref, new_score)
        
        if is_updated:
            print(f"Score for {username} updated from {old_score} to {new_score}")
            return {"status": "updated", "old_score": old_score, "new_score": new_score}
        else:
            print(f"Score for {username} was not updated. New score ({new_score}) is not better than current ({old_score}).")
            return {"status": "not_updated", "current_score": old_score, "new_score": new_score}

    except Exception as e:
        print(f"Firestore transaction failed for {username}: {e}")
        raise e
