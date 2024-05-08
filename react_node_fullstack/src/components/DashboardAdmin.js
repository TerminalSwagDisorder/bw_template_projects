import React from "react";
import { Button, Container } from "react-bootstrap";
import { Outlet, Link } from "react-router-dom";
import { FaUsersCog } from "react-icons/fa";
import { LiaSchoolSolid } from "react-icons/lia";

const Admin = ({ setCurrentUser, currentUser }) => {
  return (
    <div className="mt-4 topButtons">
      <Link to="/admin/users">
        <Button className="adminDashboardButton" style={{ width: "100%" }}>
          All users &nbsp;
          <FaUsersCog />
        </Button>
      </Link>
      <Link to="/admin/courses">
        <Button className="adminDashboardButton" style={{ width: "100%" }}>
          All courses &nbsp;
          <LiaSchoolSolid />
        </Button>
      </Link>
      <Outlet />
    </div>
  );
};

export default Admin;
