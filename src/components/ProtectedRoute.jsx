import { Navigate } from "react-router-dom";


export default function ProtectedRoute({
  children,
  permission,
}) {


  const savedUser =
    localStorage.getItem("erp_user") ||
    sessionStorage.getItem("erp_user");


  if(!savedUser){

    return <Navigate to="/login" />;

  }


  const user =
    JSON.parse(savedUser);



  if(user.role === "Admin"){

    return children;

  }



  if(permission && !user[permission]){

    return <Navigate to="/" />;

  }



  return children;

}