# File name: db_creator_sqlite.py
# Auth: TerminalSwagDisorder
# Desc: File containing code for creating a database for sqlite & inserting some data

from pathlib import Path
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.sql.expression import ColumnClause
from sqlalchemy import create_engine, Column, INTEGER, TEXT, ForeignKey, Table, MetaData
from sqlalchemy.orm import relationship

Base = declarative_base()

def main():
	dbPath = Path(__file__).resolve().parent
	engine = create_engine("sqlite:///" + str(dbPath.joinpath("python_db.db")), echo=True, pool_pre_ping=True)

	Base.metadata.create_all(engine)

	Session = sessionmaker(bind=engine)
	session = Session()

    # Define metadata information
	metadata = MetaData()

	add_entries(engine, session, metadata)

	return engine, session, metadata

def add_entries(engine, session, metadata):
	# Add entries to the "users" table
	users = [
		User(Name="Sami", Gender="Male", RoleID=1, Email="sami@example.com", Password="password1"),
		User(Name="Benjamin", Gender="Male", RoleID=2, Email="benjamin@example.com", Password="password2"),
		User(Name="Newuser", Gender="Male", RoleID=1, Email="new@test.user", Password="$2b$10$i.CS1P1lXPH90QFs2kXj7u4Ple/9zVVz4BLs77G8av4gWlNwzdhRG"),
		User(Name="Tester", Gender="Female", RoleID=2, Email="tester@example.com", Password="password4"),
		User(Name="AnotherUser", Gender="Female", RoleID=1, Email="anotheruser@example.com", Password="password5"),
		User(Name="AdminGuy", Gender="Male", RoleID=1, Email="adminguy@example.com", Password="password6"),
	]

	# Add entries to the "roles" table
	roles = [
		Role(RoleName="User", AccessLevel="1"),
		Role(RoleName="Admin", AccessLevel="2"),
	]

	# Add entries to the "admins" table
	admins = [
		Admin(UserID=2, Department="Administration"),
		Admin(UserID=4, Department="Administration"),
	]

	# Add entries to the session and commit changes
	try:
		[session.merge(role) for role in roles]
		[session.merge(user) for user in users]
		[session.merge(admin) for admin in admins]
		session.commit()
	except OperationalError as e:
		print(f"Failed to add test data: {e}")


#Create all tables
class User(Base):
	__tablename__ = "users"
	__table_args__ = (
		Column("UserID", INTEGER, primary_key=True, autoincrement=True),
		Column("Name", TEXT),
		Column("Gender", TEXT),
		Column("ProfileImage", TEXT),
		Column("RoleID", INTEGER, ForeignKey("roles.RoleID"), server_default="1"),
		Column("Email", TEXT, unique=True),
		Column("Password", TEXT),
	)

class Role(Base):
	__tablename__ = "roles"
	__table_args__ = (
		Column("RoleID", INTEGER, primary_key=True, autoincrement=True),
		Column("RoleName", TEXT),
		Column("AccessLevel", TEXT),
	)

class Admin(Base):
	__tablename__ = "admins"
	__table_args__ = (
		Column("AdminID", INTEGER, primary_key=True, autoincrement=True),
		Column("UserID", INTEGER, ForeignKey("users.UserID")),
		Column("Department", TEXT),
	)

if __name__ == "__main__":
	main()