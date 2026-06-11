from fastapi import Header

async def get_user_id(x_user_id: str = Header(default="anonymous")) -> str:
    return x_user_id
