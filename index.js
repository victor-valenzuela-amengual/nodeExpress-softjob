const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config();
const jwt = require("jsonwebtoken");

const {  
  verificarCredenciales,  
  registrarUsuario,
  verificarUsuario,
  getUsuarios,
  deleteUsuario,
  updateUsuario,
  updatePaswword
} = require("./consultas");

app.listen(3000, console.log("SERVER ON"));
app.use(cors());
app.use(express.json());

///////////////////////////Middleware
const verificarUsuarioRegistrado = async (req, res, next) => {
  const { email } = req.body;  
  let user = await verificarUsuario(email);
  if (user === 0) 
    next();
  else 
  {
    res.status(400).send(`El correo ${email} está registrado\nIntente con otro`);
  }
    
};

const verificarToken = async (req, res, next) => {
  try {      
    const Authorization = req.header("Authorization");      
    
    if(Authorization===undefined)
    {
      throw { code: 500, error:'No se ha enviado el token de autorización' };
    }
    
    const token = Authorization.split("Bearer ")[1];          
    jwt.verify(token, process.env.TOKEN);        
    next();
  } catch (error) {        
    res.status(error.code || 500).send(error);
  }
};

let correo={};
const decodificarToken = (req, res, next) =>{
  try {
        
    const Authorization = req.header("Authorization");
    const token = Authorization.split("Bearer ")[1];    
    correo = jwt.decode(token);    
    console.log(correo.email);    
    next();
  } catch (error) {
    res.status(error.code || 500).send(error);
  }
}

const reportarConsulta = async (req, res, next) => {

  let parametros;
  if (req.query) 
      parametros = req.query;        
  else if (req.params) 
    parametros = req.params;    
  else
    parametros = "";
    

  const url = req.url;
  let prm=`Hoy ${new Date()} se ha recibido una consulta en la ruta ${url}`;
  if(parametros.length !== undefined)
    console.log(`${prm} con los parámetros: ${parametros}`);
  else
    console.log(prm);  
  next();
};
const verificarBody = (req, res,next) => {
  try {
    const data = req.body;
    //console.log("verificarBody:" + data.password);
    if (data.password === undefined) {
      //console.log("No se ha enviado el cuerpo de la consulta");
      throw { code: 500, error: "No se ha enviado el cuerpo de la consulta" };
    }
    next();
  } catch (error) {
    //console.log("error en verificaBody:" + error);
    res.status(error.code || 500).send(error);
  }
};
/////////////////////////////////////////

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;        
    await verificarCredenciales(email, password);        
    const token = jwt.sign({ email }, process.env.TOKEN, { expiresIn: "10h" });
    res.send(token);
  } catch (error) {
      res.status(error.code || 500).send(error.message);
  }
});


app.post("/usuarios", reportarConsulta,verificarUsuarioRegistrado,
    async (req, res) => {
    try {
      const usuario = req.body;
      await registrarUsuario(usuario);
      res.send("Usuario creado");
    } catch (error) {
      res.status(error.code || 500).send(error);
    }
  }
);

app.get("/usuarios", reportarConsulta,async (req, res) => {
  try {
    const usuarios = await getUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(error.code || 500).send(error);
  }
});

app.delete("/usuarios/:id",reportarConsulta, verificarToken,async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUsuario(id);
    res.status(200).send("Usuario eliminado");
  } catch (error) {
    res.status(error.code || 500).send(error);
  }
});

app.put("/usuarios/:id",reportarConsulta,verificarToken,async (req, res) => {
  try {
    const { id } = req.params;    
    await updateUsuario(id,req.body);
    res.status(200).send("Usuario actualizado");
  } catch (error) {
    res.status(error.code || 500).send(error);
  }
});

app.put("/password/:id",verificarBody,reportarConsulta,verificarToken,decodificarToken,async (req, res) => {
  try {                    
    const { id } = req.params;        
    const data = req.body;
    //console.log('put/password: ' + data.password)
   await updatePaswword(id,data);   
   res.status(200).send(`Contraseña del usuario ${correo.email} actualizada`);
  } catch (error) {
    res.status(error.code || 500).send(error);
  }
});

app.use((req, res)=>{
  res.send(404);
});