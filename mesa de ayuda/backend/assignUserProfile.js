const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mesa_ayuda'
};

async function assignUserProfile() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Perfil técnico de Especialista en Redes
    const perfilRedes = {
      id: 3,
      nombre: "Especialista en Redes",
      especialidades: ["Redes", "Conectividad", "Cableado", "Sistemas Operativos", "Impresoras", "Mantenimiento", "Proyectores", "Sistemas telefónicos"],
      nivel_requerido: "avanzado"
    };

    // Actualizar usuario jcrios
    const updateQuery = `
      UPDATE users 
      SET 
        especialidad = ?,
        perfil_tecnico = ?,
        areas_experiencia = ?
      WHERE username = ?
    `;

    const [result] = await connection.execute(updateQuery, [
      'Redes', // especialidad
      JSON.stringify(perfilRedes), // perfil_tecnico
      JSON.stringify(perfilRedes.especialidades), // areas_experiencia
      'jcrios' // username
    ]);

    if (result.affectedRows > 0) {
      console.log('✅ Perfil técnico asignado exitosamente a jcrios');
      console.log('📋 Perfil asignado:', perfilRedes.nombre);
      console.log('🔧 Especialidades:', perfilRedes.especialidades.join(', '));
      console.log('📊 Nivel requerido:', perfilRedes.nivel_requerido);
    } else {
      console.log('❌ No se pudo actualizar el usuario jcrios');
    }

    // Verificar la actualización
    const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', ['jcrios']);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('\n🔍 Verificación de la actualización:');
      console.log('   Username:', user.username);
      console.log('   Especialidad:', user.especialidad);
      console.log('   Nivel experiencia:', user.nivel_experiencia);
      console.log('   Perfil técnico:', user.perfil_tecnico ? JSON.parse(user.perfil_tecnico).nombre : 'null');
      console.log('   Áreas experiencia:', user.areas_experiencia ? JSON.parse(user.areas_experiencia).length + ' áreas' : 'null');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
assignUserProfile();

