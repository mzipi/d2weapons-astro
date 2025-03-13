import { createYoga, createSchema } from 'graphql-yoga';
import typeDefs from '../../graphql/schema.js';
import resolvers from '../../graphql/resolvers.js';

const schema = new createSchema({
    typeDefs,
    resolvers,
});

const { handleRequest } = createYoga({
    schema,
    graphqlEndpoint: '/api/graphql',
    fetchAPI: {
        Request: Request,
        Response: Response,
    },
});

export const POST = async (context) => {
    const { request } = context;
    return handleRequest(request, context);
};

// export async function POST(req) {
//     try {
//         // Usamos req.text() para obtener el cuerpo de la solicitud como texto
//         const body = await req.text();
//         const { query, variables } = JSON.parse(body); // Parseamos el texto a JSON

//         // Ejecuta la consulta GraphQL
//         const { data, errors } = await server.executeOperation({ query, variables });

//         // Si hay errores, los imprimimos en la consola
//         if (errors) {
//             console.error('Errores en la consulta GraphQL:', errors);
//         }

//         // Devuelve la respuesta con los datos o los errores
//         return new Response(JSON.stringify({ data, errors }), {
//             headers: { 'Content-Type': 'application/json' },
//             status: errors ? 400 : 200,
//         });
//     } catch (error) {
//         console.error('Error en la consulta GraphQL:', error);
//         return new Response(
//             JSON.stringify({ error: `Error en la consulta GraphQL: ${error.message}` }),
//             { status: 500, headers: { 'Content-Type': 'application/json' } }
//         );
//     }
// }