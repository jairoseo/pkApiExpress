const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI;

try {
    mongoose.connect(mongoUri);
    console.log("Conexion DB exitosa");
} catch (error) {
    console.error("Error de conexion", error);
}

const pokemonSchema = new mongoose.Schema({
    numero : Number,
    nombre: String,
    tipo: String,
    habilidad: String,
    });

const Pokemon = mongoose.model("Pokemon", pokemonSchema);

function url(req){
    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}`;
    return fullUrl;
};

/**
 * Ruta Inicial
 * @http GET
*/
app.get("/", (req, res) => {
    let urlActual = url(req);
    let enlaces = {
        "Listar Pokemones" : `${urlActual}/pokemon`,
        "Ver Pokemon" : `${urlActual}/pokemon/nombre`,
        "Crear Pokemon @Leer_Codigo" : `${urlActual}/addPokemon`,
        "Editar Pokemon @Leer_Codigo" : `${urlActual}/editPokemon`,
        "Borrar Pokemon @Leer_Codigo" : `${urlActual}/delPokemon`,
    };     
    res.json(enlaces);
});

/**
 * Listar Pokemons
 * @http GET
 */
app.get("/pokemon", async (req, res) => {
    try {
        let urlActual = url(req);
        const pokemones = await Pokemon.find(); 
        const pokemonesConUrl = pokemones.map(pokemon => ({
            ...pokemon.toObject(),
            url: `${urlActual}/pokemon/${pokemon.nombre}`
        }));
        res.json(pokemonesConUrl);        
    } catch (error) {
        res.status(500).send("Error al cosultar los pokemons");
    }
});

/**
 * Ver Pokemon
 * @http GET
 * @param {string} nombre
 */
app.get("/pokemon/:nombre", async (req, res) => {
    try {
        const pokemon = await Pokemon.findOne({ nombre: new RegExp('^' + req.params.nombre + '$', 'i') });
        if(pokemon){
            res.json(pokemon);
        }else{
            res.redirect('/pokemon');
        }
    } catch (error) {
        res.status(500).send("error al buscar el pokemon");
    }
});

/**
 * Seguridad Simple
 * Para evitar ejecuciones no autorizadas
*/
app.use((req, res, next) => {
    const authToken = req.headers["authorization"];
    if(authToken === 'miTokenSecreto123'){
        next();
    }else{
        res.status(401).send("Acceso no autorizado");
    }
});

/**
 * Crear Pokemon
 * Todos los campos son necesarios
 * @http POST
 * @param {number} numero
 * @param {string} nombre
 * @param {string} tipo
 * @param {string} habilidad
 */
app.post("/addPokemon", async (req, res) => {    
    if(req.body.numero && req.body.nombre && req.body.tipo && req.body.habilidad){
        const pokemon = new Pokemon({
            numero : req.body.numero,
            nombre : req.body.nombre,
            tipo : req.body.tipo,
            habilidad : req.body.habilidad,
        });
        try {
            await pokemon.save();
            res.json(pokemon);
        } catch (error) {
            res.status(500).send("Error al guardar el pokemon");
        }
    }else{
        res.status(404).send("Campos incompletos");
    }
});

/**
 * Editar Pokemon
 * No es muy seguro pasar los parametros sin control, pero es una prueba para estudiar
 * @http PUT
 * @param {number} numero
 * @param {string} nombre
 * @param {string} tipo
 * @param {string} habilidad
 */
app.put("/editPokemon/:id", async (req,res) => {
    try {
        const datosActualizar = req.body;
        const pokemon = await Pokemon.findByIdAndUpdate(
            req.params.id,
            {
                $set: datosActualizar
            },
            {new : true}
        );
        if(pokemon){
            res.json(pokemon);
        }else{
            res.status(404).send("Pokemon no encontrado");
        }
    } catch (error) {
        res.status(500).send("Error al actualizar el pokemon");
    }
});

/**
 * Borrar Pokemon
 * @http DELETE
 * @param {number} id
 */
app.delete("/delPokemon/:id", async (req, res) => {
    try {
        const pokemon = await Pokemon.findByIdAndDelete(req.params.id);
        if(pokemon){
            res.status(200).send("Pokemon Eliminado");
        }else{
            res.status(404).send("Pokemon no encontrado");
        }
    } catch (error) {
        res.status(500).send("Error al eliminar el pokemon");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}/`);
});