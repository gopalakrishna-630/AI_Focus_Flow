import re
with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/database.py", "r") as f:
    content = f.read()

new_model = """
class Material(db.Model):
    __tablename__ = 'materials'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # allow null for testing
    filename = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
"""
if "class Material" not in content:
    content += new_model
    with open("/home/gopalakrishna/Documents/AI_Focus_Flow/backend/database.py", "w") as f:
        f.write(content)
