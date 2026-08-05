import secrets
import string

def generate_join_code(length: int = 6) -> str:
    """Generate a random join code consisting of uppercase letters and digits."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))