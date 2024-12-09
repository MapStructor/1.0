import { useFormik } from 'formik';
import { CSSProperties } from 'react';
import '../../app/globals.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { setCookie } from 'cookies-next';
import * as crypto from 'crypto';

const Home = () => {

  const buttonStyling: CSSProperties = {
    float: 'left',
    color: 'black',
    textAlign: 'center',
    padding: '10px',
    textDecoration: 'none',
    fontSize: '15px',
    lineHeight: '25px',
    borderRadius: '4px',
    border: 'solid black',
    fontWeight: 'bold',
    marginTop: '3px',
    margin: '0px',
    fontFamily: "Arial",
    alignItems: 'center',
    display: 'inline-flex',
    backgroundColor: '#e8e1da'
  };

  const imageOverlayStyling: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1, // Ensure the overlay is below the form
  }


  const formStyling: CSSProperties = {
    position: 'relative',
    zIndex: 2, // Ensure the form is on top
    marginTop: '30px'
  }

  const imageStyling: CSSProperties = {
    objectFit: 'cover'
  }

  const setAuth = (token: string) => {
    setCookie('authToken', token, { maxAge: 60 * 60 * 2 }); // Cookie lasts for 2 hours (MATCH BACKEND)
  }

  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      username : '',
      password: '',
    },

    onSubmit: async (values) => {
      try {

        const encrypted = encrypt(values.password);

        process.env.USERNAME =  values.username;
        process.env.PASSWORD = encrypted;

        const response = await fetch('api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({...values, encrypted}),
        });

        formik.resetForm();

        if(response.ok) {

          response.json().then(x => {
            setAuth(x.token); //set env token for auth
            router.push('/');
          })
        } else {
          alert(`Failed to find a user with those credentials. Please try again.`);
        }
      } catch (error) {
        alert(`Login Error: ${error}`);
      }
    },
  });

  const encrypt = (password : string) => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
  }


  const boxStyling: CSSProperties = {
    padding: '8px',
    borderRadius: '4px',
    border: 'solid black',
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '10px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
  };

  const labelStyling: CSSProperties = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: 'white',
  };

  return (
    <>
    <div id='app-body-main'>
      <input className="checker" type="checkbox" id="o" hidden />

      <div className="header">
        <a href="http://newamsterdamhistorycenter.org" className="logo">
          <img
            id="logo-img-wide"
            src="http://newamsterdamhistorycenter.org/wp-content/uploads/2018/02/cropped-cropped-sprite-1.png"
          />
          <img id="logo-img" src="icons/icon_57x57.png" />
        </a>

        <div id="header_text" className="headerText">
          <span id="headerTextSuffix">|</span> Mapping Early New York
        </div>

        <div className="header-right">
          <a
            className="encyclopedia"
            href="https://newamsterdamhistorycenter.org/full-3d-model/"
            target="_blank"
            >3D Map
            <img
              className="img2"
              height="18"
              src="https://encyclopedia.nahc-mapping.org/sites/default/files/inline-images/external_link_icon.png"
              width="18"
              style={{marginLeft: "5px"}}
          /></a>
          <a
            className="encyclopedia"
            href="https://encyclopedia.nahc-mapping.org/"
            target="_blank"
            >Encyclopedia
            <img
              className="img2"
              height="18"
              src="https://encyclopedia.nahc-mapping.org/sites/default/files/inline-images/external_link_icon.png"
              width="18"
              style={{marginLeft: "5px"}}
          /></a>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>

      <Image 
        src="/castello_newest.jpg" 
        alt="Background"
        fill 
        style={imageStyling}
      />
      <div style={imageOverlayStyling}></div> 
      <div style={formStyling}>
      <form onSubmit={formik.handleSubmit} style={{ maxWidth: '400px', margin: '0 auto', paddingTop: '30px' }}>          
          <div style={{ marginBottom: '15px', color: '#333' }}>
              <label htmlFor="username" style={labelStyling}>Username:</label>
              <input type="text" id="username" name="username" onChange={formik.handleChange} value={formik.values.username} style={boxStyling} />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
              <label htmlFor="password" style={labelStyling}>Password:</label>
              <input type="password" id="password" name="password" onChange={formik.handleChange} value={formik.values.password} style={boxStyling} />
          </div>
          <button style={buttonStyling}
            type="submit">
            Submit
          </button>
        </form>
      </div>
      </div>
      </div>
    </>
  );
}

export default Home;