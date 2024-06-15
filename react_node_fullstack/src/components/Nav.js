import { useEffect, useState, useContext  } from "react";
import Container from "react-bootstrap/Container";
import { Nav, Navbar, NavDropdown, Button, Image } from "react-bootstrap";
import { Link } from "react-router-dom";

const NavBar = ({ currentUser, handleUserChange, handleSignout, ThemeContext }) => {
	const [activeLink, setActiveLink] = useState("home");
	const [scrolled, setScrolled] = useState(false);
	const { theme, toggleTheme } = useContext(ThemeContext);

	useEffect(() => {
	const onScroll = () => {
	  if (window.scrollY > 50) {
		setScrolled(true);
	  } else {
		setScrolled(false);
	  }
	};

		window.addEventListener("scroll", onScroll);

		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	
	
	const onUpdateActiveLink = (value) => {
		setActiveLink(value);
	};
  
  // Async function for signout
  const handleLogout = async () => {
    try {
      await handleSignout();
      handleUserChange(null);
    } catch (error) {
      console.log(error.message);
    }
  };
  const userNavbar = () => {
    let adminCheck;
    let userCheck;
    if (currentUser && currentUser.role !== "user") {
      adminCheck = (
		  <>
			  <Nav.Link as={Link} to="/admin/dashboard">
				Dashboard
			  </Nav.Link>
		  </>
      );
    }
    if (currentUser) {
      userCheck = (
		  <>
            <Nav.Link as={Link} to="/profile">
              {currentUser.name}
            </Nav.Link>
            <Nav.Link as={Link} to="/" onClick={handleLogout}>
              Log out
            </Nav.Link>
		  </>

      );
    } else {
      userCheck = (
        // If false do this
	  <>
		<Nav.Link as={Link} to="/signin">
		  Not signed in
		</Nav.Link>
		<Nav.Link as={Link} to="/signup">
		  Signup
		</Nav.Link>
	  </>
      );
    }
    return (
		<>
        {userCheck}
        {adminCheck}
		</>
    );
  };
	
	return (
    <Navbar expand="md" className={scrolled ? "scrolled" : ""}>
      <Container>
        <Navbar.Brand as={Link} to="/">
			KoneAvustajat
        </Navbar.Brand>
		<Button className="themeSwitcher" onClick={toggleTheme}>
			Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
		</Button>
        <Navbar.Toggle aria-controls="basic-navbar-nav">
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto">
            <Nav.Link as={Link} to="/" className={ activeLink === "/" ? "active-navbar-link" : "navbar-link" } onClick={() => onUpdateActiveLink("/")}>
              Home
            </Nav.Link>
          </Nav>
		  <Nav className="ml-auto">
			{userNavbar()}
		  </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
