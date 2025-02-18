import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import * as jose from 'jose';
import { Buffer } from 'buffer';

const Callback = () => {
  const [userInfo, setUserInfo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchToken = async (code) => {
      try {
        const clientId = process.env.REACT_APP_CLIENT_ID;
        const signedJwt = await generateSignedJwt(clientId);

        const response = await axios.post(
          '/v1/esignet/oauth/v2/token',
          new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.REACT_APP_REDIRECT_URI,
            client_id: clientId,
            client_assertion_type: process.env.REACT_APP_CLIENT_ASSERTION_TYPE,
            client_assertion: signedJwt,
            code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token } = response.data;
        console.log("Access token:", access_token);

        const userInfoResponse = await axios.get('/v1/esignet/oidc/userinfo', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        console.log("User info response:", userInfoResponse.data);
        const decodedUserInfo = await decodeUserInfoResponse(userInfoResponse.data);
        console.log("Decoded user info:", decodedUserInfo);

        // Store the decoded user info in state
        setUserInfo(decodedUserInfo);

      } catch (error) {
        console.error('Error fetching token or user info:', error);
      }
    };

    const query = new URLSearchParams(location.search);
    const code = query.get('code');

    if (code) {
      fetchToken(code);
    }

  }, [location.search]);

  return (
    <div
  className="container-fluid"
  style={{
    backgroundColor: '#1a1a2e',
    color: 'white',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '20px',
  }}
>
  <header
    className="navbar navbar-dark w-100"
    style={{
      backgroundColor: '#0f3460',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      padding: '15px',
      textAlign: 'center',
    }}
  >
    <h1
      className="navbar-brand"
      style={{ color: '#f8c94e', fontSize: '1.75rem', display: 'flex', alignItems: 'center' }}
    >
      <img
        src="./national-id-logo.png"
        alt="Logo"
        width="50"
        height="50"
        style={{ marginRight: '15px' }}
      />
      Fayda Mock Relying Party - User Info
    </h1>
  </header>

  <main className="container my-5" style={{ width: '100%', maxWidth: '900px', textAlign: 'center' }}>
    {userInfo ? (
      <div
        className="card my-4"
        style={{
          backgroundColor: '#162447',
          borderRadius: '15px',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
          border: 'none',
        }}
      >
        <div className="card-body" style={{ padding: '30px' }}>
          <h5 className="card-title text-center" style={{ color: '#f8c94e', fontWeight: 600 }}>
            User Information
          </h5>
          <ul className="list-group list-group-flush" style={{ listStyleType: 'none', padding: 0 }}>
  <li className="list-group-item" style={{ backgroundColor: '#0f3460', borderColor: '#f8c94e', color: 'white', textAlign: 'left', paddingLeft: '20px' }}>
    <strong>Name:</strong> {userInfo.name || 'N/A'}
  </li>
  <li className="list-group-item" style={{ backgroundColor: '#0f3460', borderColor: '#f8c94e', color: 'white', textAlign: 'left', paddingLeft: '20px' }}>
    <strong>Email:</strong> {userInfo.email || 'N/A'}
  </li>
  <li className="list-group-item" style={{ backgroundColor: '#0f3460', borderColor: '#f8c94e', color: 'white', textAlign: 'left', paddingLeft: '20px' }}>
    <strong>Gender:</strong> {userInfo.gender || 'N/A'}
  </li>
  <li className="list-group-item" style={{ backgroundColor: '#0f3460', borderColor: '#f8c94e', color: 'white', textAlign: 'left', paddingLeft: '20px' }}>
    <strong>Phone:</strong> {userInfo.phone || 'N/A'}
  </li>
  <li className="list-group-item" style={{ backgroundColor: '#0f3460', borderColor: '#f8c94e', color: 'white', textAlign: 'left', paddingLeft: '20px' }}>
    <strong>Nationality:</strong> {userInfo.residenceStatus || 'N/A'}
  </li>
  <li className="list-group-item" style={{ backgroundColor: '#0f3460', borderColor: '#f8c94e', color: 'white', textAlign: 'left', paddingLeft: '20px' }}>
    <strong>Date of Birth:</strong> {userInfo.birthdate || 'N/A'}
  </li>
  <li className="list-group-item" style={{ backgroundColor: '#0f3460', borderColor: '#f8c94e', color: 'white', textAlign: 'left', paddingLeft: '20px' }}>
    <strong>Address:</strong> {userInfo.address ? `${userInfo.address.zone}, ${userInfo.address.kebele}, ${userInfo.address.woreda}, ${userInfo.address.region}` : 'N/A'}
  </li>
  {userInfo.picture && (
    <li className="list-group-item" style={{ backgroundColor: '#0f3460', borderColor: '#f8c94e' }}>
      <img
        src={userInfo.picture}
        alt="User"
        className="img-fluid rounded-circle"
        width="150"
        style={{ border: '3px solid #f8c94e', padding: '5px' }}
      />
    </li>
  )}
  
  
</ul>

        </div>
      </div>
    ) : (
      <p>Loading...</p>
    )}
  </main>

  <footer className="w-100 text-center" style={{ backgroundColor: '#0f3460', marginTop: '60px', padding: '20px 0', borderTop: '2px solid #f8c94e' }}>
    <p style={{ margin: 0, fontSize: '14px' }}>&copy; 2025 National ID. All Rights Reserved.</p>
  </footer>
</div>

  );
};



const generateSignedJwt = async (clientId) => {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: clientId,
    sub: clientId,
    aud: process.env.REACT_APP_TOKEN_ENDPOINT,
  };

  const decodeKey = Buffer.from(process.env.REACT_APP_PRIVATE_KEY, 'base64')?.toString();
  const jwkObject = JSON.parse(decodeKey);
  const privateKey = await jose.importJWK(jwkObject, 'RS256');

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader(header)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(privateKey);

  return jwt;
};

const decodeUserInfoResponse = async (userinfoJwtToken) => {
  try {
    return jose.decodeJwt(userinfoJwtToken);
  } catch (error) {
    console.error('Error decoding JWT user info:', error);
    return null;
  }
};

const styles = {
  footer: {
    position: "absolute",
    bottom: "10px",
    color: "white",
    fontSize: "12px",
  },
}

export default Callback;
