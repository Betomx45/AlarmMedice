import db from "database/models/index"
import bcrypt from 'bcrypt';
import { passwordEmail } from "@/utils/passwordEmail";

export default async function handler(req, res) {
  try {
    if(!req.body.correo) {
      return res.status(400).json({
        error: true,
        message: 'El correo es obligatorio.'
      });
    }

    //buscar usuario 
    const user = await db.Usuario.findOne(
      {
        where: { correo: req.body.correo },
      }
    );
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'El usuario no existe.'
      });
    }

    //generar un token de recuperación
    let token = await bcrypt.hash(user.correo + Date.now().toString(), 10);
    token = token.replace(/\//g, "-"); // reemplazar todas las diagonales por un guión
    
    //guardar el token en la info del usuario
    user.passwordResetToken = token ; 
    user.passwordResetExpire = Date.now() + 3600000; // expira en una hora
    
    await user.save();

    //enviar el correo
    const sendcorreo =  await passwordEmail(
      user.nombre,
      user.correo,
      token
    );

    if(sendcorreo){
      return res.json({
        message: 'El correo de recuperción ha sido enviado.'
      });
    }

    res.status(503).json({
      error: true,
      message: 'Falló el envío de correo.'
    });
    
  } catch (error) {
    console.log(error);
    let errors = [];
        if (error.errors) {
            //extraer la información de los campos que tienen error
            errors = error.errors.map((item) => ({
                error: item.message,
                field: item.path,
            }));
        }

    res. json({ error: true, message: 'Error al realizar la recuperación de contraseña.' });
  }
}