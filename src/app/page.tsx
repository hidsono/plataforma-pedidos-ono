export default function Maintenance() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f4f4f4',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px' }}>Site em Manutenção</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>Estaremos de volta em breve. Obrigado pela paciência!</p>
    </div>
  );
}
