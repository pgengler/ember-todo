import { Response } from 'ember-cli-mirage';

export default function(server) {
  server.post('/api/v2/tasks', function() {
    return new Response(500, { }, {
      errors: [
        {
          status: 500,
          detail: 'Something went wrong'
        }
      ]
    });
  });
}
