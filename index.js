const Joi = require('joi') // for validation
const movies_json = require ('../Movies_API/movies_json')
const express = require('express');
const app = express();
app.use(express.json());
const uuid = require('uuid')

const movies = movies_json;

app.get('/', (req,res) => {
    res.send(`
    Welcome, This is Movies APIs Assignment - By Aditi Parikh
    Here is the API List.
        1) http://localhost:3000/api/movies (GET) : It will return the list of all movies object in array.
        2) http://localhost:3000/api/movies?sort=title&order=asc (GET) : Accepts sort value as 'title|rating|year|genres' and order value as 'asc|dsc' By default order is asc. 
        3) http://localhost:3000/api/movies/:id (GET) : It will return movie object which id is passed as param.
        4) http://localhost:3000/api/movies/search?q=title (GET) : Movies are filtered by name. separate words in the search param will also return results of movie titles containing any of them.
        5) http://localhost:3000/api/movies (POST) : Add a Movie. Accepts movie object as body json param. Rating param under movie object is optional.
                                                                    Ex. {
                                                                            "title": "Fast and Furious",
                                                                            "genres": "Action",
                                                                            "year": "2020",
                                                                            "rating": 3.9
                                                                        }
        6) http://localhost:3000/api/movies/:id (PUT) : Update existing movie object by id. Pass the movie object same as above in body json.
        7) http://localhost:3000/api/movies/:id (DELETE) : Will Delete the movie from the array which id is passed as param.
    `);
});

// GET All Movies - /api/movies
// GET Movies with Sorting on title|rating|year|genres. Default order is 'asc' unless specified.
app.get('/api/movies', (req,res) => {
    
    if (Object.keys(req.query).length === 0)
    {
        if(movies.length === 0) return res.status(404).send({ error : 'No Movies Data available!'});
        res.send(movies);
    }
    else 
    {
        const sortBy = req.query.sort;
        const orderBy = req.query.order || 'asc';
        if(!sortBy) return res.status(404).send({ error : 'Invalid query Parameters!'});
        let moviesSorted =[]
        switch(sortBy.toLowerCase())
        {
            case 'title':
               moviesSorted = movies.sort((a,b) => (a.title > b.title) ? 1 : -1);
               break;
            case 'rating':
                moviesSorted = movies.sort((a,b) => a.rating - b.rating);
                break;
            case 'year':
                moviesSorted = movies.sort((a,b) => a.year - b.year);
                break;
            case 'genres':
                moviesSorted = movies.sort((a,b) => (a.genres > b.genres) ? 1 : -1);
                break;
            default :
                return res.status(404).send({ error : 'Invalid value of Sort Parameter!'});
                
        }
        
        moviesSorted =  (orderBy === 'dsc') ? moviesSorted.reverse() : moviesSorted;
       
        res.send(moviesSorted);
    }

});

// Filter by Movie id - /api/movies/:id
// GET Movie by Name - /api/movies/search?q=movieTitle
app.get('/api/movies/:param', (req,res) => {

    if(req.params.param === 'search')
    {
        // Search Movie Logic
        let searchParam = req.query.q.toLowerCase();

        let results = searchMoviesByName(searchParam);

        if (results.length == 0) return res.status(404).send({ error: 'The Movie with given Name is not found.!'});
        
        res.send(results);
    }
    else 
    {
        const movie = movies.find(m => m.id === req.params.id);
        if (!movie) return res.status(404).send({ error : 'The Movie with given ID is not found.!'});
        
        res.send(movie);
    }
});

// Add a new Movie - POST Call
app.post('/api/movies', (req,res) => {

    const { error } = validateMovie(req.body); // result.error
    if(error) return res.status(400).send({ error : error.details[0].message });

    const movie = {
        "title": req.body.title,
        "genres": req.body.genres,
        "year": req.body.year,
        "id": uuid.v1(),
        "rating": req.body.rating || 1.0
      };
    movies.push(movie);
    res.send(movie);
}); 

//Update a Movie - PUT Call
app.put('/api/movies/:id',(req,res) => {

    const movie = movies.find(m => m.id == req.params.id);
    if (!movie) return res.status(404).send({ error: 'The Movie with given ID is not found.!'});
    
    //Validate
    const { error } = validateMovie(req.body); // result.error

    if(error) return res.status(400).send({ error : error.details[0].message });

    movie.title = req.body.title;
    movie.genres = req.body.genres
    movie.year = req.body.year
    movie.rating = req.body.rating || 1.0

    res.send(movie);

});

// Delete a movie - DELETE Call
app.delete('/api/movies/:id',(req,res) => {
    const movie = movies.find(m => m.id == req.params.id);
    if (!movie) return res.status(404).send({error : 'The Movie with given ID is not found.!'});

    const index = movies.indexOf(movie);
    movies.splice(index,1);

    res.send(movies)
})

function validateMovie(movie)
{
    const schema = Joi.object({
        title : Joi.string().min(1).max(128).required(),
        genres : Joi.string().optional().default(''),
        rating : Joi.number().min(1.0).max(5.0).optional().default(1.0),
        
        year : Joi.number()
        
        .min(1900)
        .max(new Date().getFullYear())
        .required()
    });

    return schema.validate(movie);
}

function searchMoviesByName(searchParam)
{
    const searchString = [];
    searchString.push(searchParam);
    const words = searchParam.split(' ');
    searchString.push(...words);
    const results = [];
    movies.forEach(movie => {
        searchString.forEach(searchWord => {
            if (movie.title.toLowerCase().includes(searchWord))
                if(!results.includes(movie)) results.push(movie);
        })
    })
    return results;

}
console.log(process.env.PORT);
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Listning to Port ${port}...`));

