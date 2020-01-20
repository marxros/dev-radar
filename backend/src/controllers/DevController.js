const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
  async index(req, res) {
    const devs = await Dev.find();

    return res.json(devs);
  },

  async store(req, res) {
    const { github_username, techs, latitude, longitude } = req.body;

    let dev = await Dev.findOne({ github_username });

    if(!dev) {
      const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`)
  
      let { name = login, avatar_url, bio } = apiResponse.data
    
      const techsArray = parseStringAsArray(techs);
    
      const location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      }
    
      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location,
      })

      // Filtrar as conexões que estão no máximo 10km de distancia
      // e que o novo dev possua pelo menos uma das tecnologias citadas

      const sendSocketMessageTo = findConnections(
        { latitude, longitude },
        techsArray,
      ) 

      sendMessage (sendSocketMessageTo, 'new-dev', dev);
    } 
    return res.json(dev);
  },

  async update(req, res) {
    const dev = await Dev.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true}
    );
    return res.json({ dev })
  },

  async destroy(req, res){
    Dev.findByIdAndDelete(req.params.id, (err, dev) => {
      if (err) return res.send(err);
      
      const response = {
        message: "Dev successfully deleted!",
        id: dev._id,
      };
      return res.send(response);
    })

  }
}