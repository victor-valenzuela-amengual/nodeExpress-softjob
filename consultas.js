const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const format = require("pg-format");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "p0stgr3s",
  database: "softjobs",
  allowExitOnIdle: true,
});

const verificarCredenciales = async (email, password) => {
  try {
    const values = [email];
    const consulta = "SELECT * FROM usuarios WHERE email = $1";
    const {rows: [usuario],rowCount,} = await pool.query(consulta, values);
    console.log("values: " + values);
    if (!rowCount)
      throw { code: 404, message: "Email o contraseña incorrecta" };
    const { password: passwordEncriptada } = usuario;
    const passok = bcrypt.compareSync(password, passwordEncriptada);
    if (!passok || !rowCount)
      throw { code: 404, message: "Email o contraseña incorrecta" };
  } catch (error) {
    throw { code: 500, message: error.message };
  }
};

const registrarUsuario = async (usuario) => {
  try {
    let { email, password, rol, lenguage } = usuario;

    const passwordEncriptada = bcrypt.hashSync(password, 10);
    console.log(passwordEncriptada);
    password = passwordEncriptada;

    const values = [email, passwordEncriptada, rol, lenguage];
    const consulta = "insert into usuarios values (default, $1,$2, $3,$4)";
    const { rowCount } = await pool.query(consulta, values);
    if (!rowCount) throw { code: 404, message: "No se agregó el usuario" };
  } catch (error) {
    console.log("error:" + error);
    throw { code: 500, error };
  }
};
const verificarUsuario = async (email) => {
  try {
    const values = [email];
    const consulta = "SELECT * FROM usuarios WHERE email = $1";
    const { rowCount } = await pool.query(consulta, values);
    if (!rowCount) return 0;
  } catch (error) {
    return 1;
  }
};

const getUsuarios = async () => {
  const { rows: users } = await pool.query(
    "SELECT id,email,rol,lenguage FROM usuarios"
  );
  return users;
};

const deleteUsuario = async (id) => {
  const consulta = "DELETE FROM usuarios WHERE id = $1";
  const values = [id];
  const { rowCount } = await pool.query(consulta, values);
  if (!rowCount)
    throw { code: 404, message: "No se encontró ningún usuario con id $1" };
};

const updateUsuario = async (id, body) => {
  try {
    const { rol, lenguage } = body;
    const values = [rol, lenguage, id];

    //Query parametrizada
    const qry = "UPDATE usuarios SET rol = $1,lenguage = $2 WHERE id = $3";

    const { rowCount } = await pool.query(qry, values);
    if (!rowCount)
      throw { code: 404, message: `No existe usuario con id ${id}` };
  } catch (error) {
    console.log("error:" + error);
    throw { code: 500, error: error.message };
  }
};

const updatePaswword = async (id, body) => {
  try {
    const { password } = body;
    const values = [id];

    const qry = "SELECT id FROM usuarios WHERE id = $1";
    const { rowCount } = await pool.query(qry, values);
    if (!rowCount)
      throw {
        code: 404,
        message: `No se encontró ningún usuario con id ${id}`,
      };
    else {
      const passwordEncriptada = bcrypt.hashSync(password, 10);
      const values = [passwordEncriptada, id];
      const qry = "UPDATE usuarios SET password = $1 WHERE id = $2";
      const { rowCount } = await pool.query(qry, values);
    }
  } catch (error) {
    console.log("error:" + error);
    throw { code: 500, error: error.message };
  }
};

module.exports = {
  verificarCredenciales,
  registrarUsuario,
  verificarUsuario,
  getUsuarios,
  deleteUsuario,
  updateUsuario,
  updatePaswword,
};
