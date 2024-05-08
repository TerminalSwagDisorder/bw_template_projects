# File name: db_creator_mysql.py
# Auth: TerminalSwagDisorder
# Desc: File containing code for creating a database for mysql & inserting some data

from pathlib import Path
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine, Column, INTEGER, TEXT, DATETIME, BOOLEAN, ForeignKey, Table, MetaData, text, UniqueConstraint, func
from sqlalchemy.exc import OperationalError

Base = declarative_base()

def main():
	# Modular user credentials
	# username = "admin"
	# password = "xJj3dJTtZagDxPl1"

	# Create credentials folder if it does not exist
	finPath = Path(__file__).resolve().parent.joinpath("credentials")
	namePath = finPath.joinpath("username")
	pwdPath = finPath.joinpath("password")

	if not finPath.exists():
		finPath.mkdir()

	if not namePath.exists() or not pwdPath.exists():
		namePath.touch()
		pwdPath.touch()

	# Use previously saved credentials
	if namePath.exists() and pwdPath.exists() and namePath.stat().st_size > 0 and pwdPath.stat().st_size > 0:
		saved_creds_input = input("Do you want to use previously saved credentials? (Y/N) \n")
	else:
		saved_creds_input = "N"

	# Use saved credentials
	if saved_creds_input.upper() in ["Y", "YES"]:
		with namePath.open("r") as file:
			username = file.read()
		with pwdPath.open("r") as file:
			password = file.read()
	else:
		username = input("Please enter mysql username: ")
		password = input("Please enter mysql password: ")
		# Save given credentials
		cred_data_input = input("Do you want to save your credentials? (Y/N) \n")
		if cred_data_input.upper() in ["Y", "YES"]:
			try:
				with namePath.open(mode="w") as file:
					file.write(username)
				with pwdPath.open(mode="w") as file:
					file.write(password)
			except Exception as e:
				print("Failed to write to file: {e}")
			print("Saved credentials")


	# MySQL connection string: "mysql+pymysql://user:password@host/dbname"
	# Connect to mysql
	engine = create_engine(f"mysql+pymysql://{username}:{password}@localhost", echo=True)

	# Create db if it does not exist
	with engine.connect() as conn:
		try:
			conn.execute(text("CREATE DATABASE IF NOT EXISTS python_db"))
			conn.execute(text("USE python_db"))
		except OperationalError as e:
			print(f"Error occurred: {e}")

	# Connect to db
	engine = create_engine(f"mysql+pymysql://{username}:{password}@localhost/python_db", echo=True, pool_pre_ping=True)
	Base.metadata.create_all(engine)

	Session = sessionmaker(bind=engine)
	session = Session()

	# Define metadata information
	metadata = MetaData()

	define_triggers(engine, session, metadata)
	add_entries(engine, session, metadata)
	trigger_check(engine, session, metadata)

	return engine, session, metadata

def define_triggers(engine, session, metadata):
	# Create a trigger for users regarding roles
	user_before_trigger = """
	CREATE TRIGGER check_user_role BEFORE INSERT ON admins
	FOR EACH ROW BEGIN
		DECLARE role_id INT;

		SELECT RoleID INTO role_id FROM users WHERE UserID = NEW.UserID;

		IF role_id != 2 THEN
			SIGNAL SQLSTATE '45000'
			SET MESSAGE_TEXT = 'This user is not an admin';
		END IF;
	END;
	"""

	# Create db if it does not exist
	with engine.connect() as conn:
		try:
			conn.execute(text(user_before_trigger))
		except OperationalError as e:
			print(f"Error occurred: {e}")

def trigger_check(engine, session, metadata):
	# Check if the trigger was successful by deliberately adding wrong data
	users = [
		User(Name="notanadmin", RoleID=1, Email="notanadmin@example.com", Password="notanadmin"),
	]

	admins = [
		Admin(UserID=7, Department="Administration"),
	]

	try:
		[session.merge(user) for user in users]
		[session.merge(admin) for admin in admins]
		session.commit()
	except OperationalError:	
		print("Trigger check successful!")
	else:
		raise Exception("Trigger check failed")

	
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
