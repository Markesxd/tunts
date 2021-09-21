const {google} = require('googleapis');
const credentials = require('./credentials.json');

const client = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
)

client.authorize(function (err){
  if(err){
    console.log(err);
    return;
  } else{
      console.log('Client authorized!');
      run(client);
  }
});

async function run(client){

  const sheets = google.sheets({
    version: 'v4',
      auth: client
  });

  const options = {
    spreadsheetId: '1exlmKkXKvKPDq6KcOHtwYzfQlgo86GXFiEtZ4R6T3ek',
    range: 'engenharia_de_software!C4:F'
  };

  console.log('Getting to the Spreadsheet');
  console.time('Data retrieved in');
  const {data} = await sheets.spreadsheets.values.get(options);
  const {values} = data;
  options.range = 'engenharia_de_software!A2';
  const data2 = await sheets.spreadsheets.values.get(options);
  const totalClassesString = data2.data.values[0][0];
  const totalClasses = Number(totalClassesString.slice(totalClassesString.indexOf(':') + 1, totalClassesString.length));
  console.timeEnd('Data retrieved in');

  console.log('Processing Data');

  const processedData = values.map(row => {
    if(row[0] >= totalClasses / 4) return ['Reprovado por falta', 0];
    const sum = row.reduce((grade, value) => Number(value) + Number(grade), -row[0]);
    const average = sum / 3;

    if(average < 5) return ['Reprovado por Nota', 0];
    if(average < 7){
      const aprovedIf = Math.ceil(10 - average);
      return ['Exame Final', aprovedIf];
    };
    return ['Aprovado', 0];
  })

  const updateOptions = {
    spreadsheetId: '1exlmKkXKvKPDq6KcOHtwYzfQlgo86GXFiEtZ4R6T3ek',
    range: 'engenharia_de_software!G4',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: processedData
    }
  };

  console.log('Updating Data');
  console.time('Data updated in');
  const res = await sheets.spreadsheets.values.update(updateOptions);
  console.timeEnd('Data updated in');

}
