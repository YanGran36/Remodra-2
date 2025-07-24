export default function TestSimple() {
  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>✅ Remodra Test Page</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        If you can see this, the routing is working!
      </p>
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        maxWidth: '400px',
        margin: '30px auto'
      }}>
        <h3>Simple Login Form</h3>
        <form onSubmit={(e) => e.preventDefault()}>
          <div style={{ marginBottom: '15px' }}>
            <label>Email:</label><br/>
            <input 
              type="email" 
              defaultValue="test@remodra.com"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Password:</label><br/>
            <input 
              type="password" 
              defaultValue="test123"
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <button 
            type="submit"
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Login
          </button>
        </form>
      </div>
    </div>
  );
} 