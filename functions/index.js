const functions = require("firebase-functions");

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
exports.helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    //response.send(request.baseUrl.toString());
    /* let provinces = [];
    for (let i = 0; i < 3; i++) {
        provinces[i] = 'กทม' + i;
    }
    return response.json({ status: true, data: provinces }); */

    // http://127.0.0.1:5001/silver-65166/us-central1/helloWorld?test=111&name=222
    console.log('vvvvv');
    console.log(request.query.name); // $_GET['name'] รับค่า get เหมือน PHP
    response.json({ status: true, data: ['aaaa'] }); // ใส่ พำ

});
