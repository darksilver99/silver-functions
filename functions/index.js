const functions = require("firebase-functions");
const admin = require("firebase-admin");
const request = require('request');
const algoliasearch = require('algoliasearch');

const REGION = "asia-east2";
const ALGOLIA_APP_ID = "ECRWTI6NJR";
const ALGOLIA_ADMIN_KEY = "12adfde0362145297237b7621bba577b";
const ALGOLIA_INDEX_NAME = "province_list";

// line
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer 4jcTi6upMHPCXxRC8avW8XlBFdp/jaSOhn/iQm4VgGU0eJSUTTR5tvTOVvNgyT1lO3+DI8w9fiLCnIrhnNvJJHj0lthEKETGVSOEeAu9U0h1qAl7PUQRNJtp3Y53SjFls+1KwVXie0TdCSgy1Ql9FgdB04t89/1O/w1cDnyilFU=`
};

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const os = require('os');
const path = require('path');
const fs = require('fs');
const Busboy = require('busboy');
const multer = require('multer');
const upload = multer({ dest: '' });

function isEmpty(checkValue) {
    if (checkValue === undefined || checkValue === null || checkValue === "" || checkValue + "" === "null") {
        return true;
    }
    return false;
}

exports.helloWorld = functions.region(REGION).https.onRequest((request, response) => {
    let provinces = [];
    for (let i = 0; i < 15; i++) {
        provinces[i] = 'กทม' + i;
    }
    response.json({ status: true, data: provinces });
    // http://127.0.0.1:5001/silver-65166/us-central1/helloWorld?test=111&name=222
    /* console.log('vvvvv');
    console.log(request.query.name); // $_GET['name'] รับค่า get เหมือน PHP
    response.json({ status: true, data: ['aaaa'] }); // ใส่ พำ */
});

exports.provincesList = functions.region(REGION).https.onRequest(async (request, response) => {
    const snapshot = await db.collection('province_list').orderBy('id', 'asc').get();
    if (snapshot.empty) {
        return response.json({ status: false, msg: 'ไม่มีข้อมูล', data: [] });
    }
    let dataList = [];
    snapshot.docs.forEach((e) => {
        dataList[dataList.length] = {
            id: e.data().id,
            name: e.data().name,
            postCode: e.data().postCode,
        }
    })
    return response.json({ status: true, msg: '', data: dataList });
});


exports.addProvince = functions.region(REGION).https.onRequest(async (request, response) => {
    const name = request.query.name ?? '';
    const postCode = request.query.postCode ?? '';
    if (name == '' || postCode == '') {
        return response.json({ status: false, msg: 'ไม่สามารถเพิ่มข้อมูลได้' });
    }
    const lastID = await getLastID('province_list');
    db.collection('province_list').add({
        "id": lastID,
        "name": name,
        "postCode": postCode
    });
    return response.json({ status: true, msg: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
});

exports.deleteProvince = functions.region(REGION).https.onRequest(async (request, response) => {
    const id = request.query.id ?? '';
    if (id == '') {
        return response.json({ status: false, msg: 'ไม่สามารถลบข้อมูลได้' });
    }
    const snapshot = await db.collection('province_list').where('id', '==', parseInt(id)).limit(1).get();

    if (snapshot.empty) {
        return response.json({ status: false, msg: 'ไม่สามารถลบข้อมูลได้' });
    }

    db.collection('province_list').doc(snapshot.docs[0].id).delete();
    return response.json({ status: true, msg: 'ลบข้อมูลเรียบร้อยแล้ว' });
});

async function getLastID(collection) {
    const snapshot = await db.collection(collection).orderBy('id', 'desc').limit(1).get();
    if (snapshot.empty) {
        return 1;
    }
    let index = snapshot.docs[0].data().id + 1;
    return index;
}

exports.LineBot = functions.region(REGION).https.onRequest((req, res) => {

    if (req.method == "POST") {
        console.log("wtf post");
        if (req.body.events[0].message.type == 'text') {
            insertToFireStore(req.body);
            // reply(req.body);
        }
        return;
    }
    console.log("wtf not post");
    return res.status(200).send(req.method);

});

const insertToFireStore = (bodyResponse) => {
    // ส่งข้อมูลพัสดุ เข้า db (ปุ่ม + ที่ทำ test ไว้)
    console.log("insertToFireStore");
    const userID = bodyResponse.events[0].source.userID; // เอาไปหาว่าคนที่แชร์ผ่าน line oa มา เป็นนิติของโครงการไหน
    const text = bodyResponse.events[0].message.text; // เอาไปหา receiveName, roomNo, trackingCode

    /* db.collection('/kconnect/koder4/stock/data/stock_list').add({
        "code": "1",
        "create_date": new Date(),
        "receiveName": "22",
        "roomNo": "33",
        "status": 1,
        "trackingCode": "TH1313131313",
    }); */
}

const reply = (bodyResponse) => {
    console.log('bodyResponse');
    console.log(bodyResponse.events[0]);
    // ส่งกลับ
    /* return request({
        method: `POST`,
        uri: `${LINE_MESSAGING_API}/reply`,
        headers: LINE_HEADER,
        body: JSON.stringify({
            replyToken: bodyResponse.events[0].replyToken,
            messages: [
                {
                    type: `text`,
                    text: bodyResponse.events[0].message.text
                }
            ]
        })
    }); */
};

exports.importProvicne = functions.region(REGION).https.onRequest(async (request, response) => {
    let name = '';
    const postCode = 'test';

    const provinceName = [
        'กรุงเทพฯ',
        'กระบี่',
        'กาญจนบุรี',
        'กาฬสินธุ์',
        'กำแพงเพชร',
        'ขอนแก่น',
        'จันทบุรี',
        'ฉะเชิงเทรา',
        'ชลบุรี',
        'ชัยนาท',
        'ชัยภูมิ',
        'ชุมพร',
        'เชียงใหม่',
        'เชียงราย',
        'ตรัง',
        'ตราด',
        'ตาก',
        'นครนายก',
        'นครปฐม',
        'นครพนม',
        'นครราชสีมา',
        'นครศรีธรรมราช',
        'นครสวรรค์',
        'นนทบุรี',
        'นราธิวาส',
        'น่าน',
        'บึงกาฬ',
        'บุรีรัมย์',
        'ปทุมธานี',
        'ประจวบคีรีขันธ์',
        'ปราจีนบุรี',
        'ปัตตานี',
        'พระนครศรีอยุธยา',
        'พะเยา',
        'พังงา',
        'พัทลุง',
        'พิจิตร',
        'พิษณุโลก',
        'เพชรบุรี',
        'เพชรบูรณ์',
        'แพร่',
        'ภูเก็ต',
        'มหาสารคาม',
        'มุกดาหาร',
        'แม่ฮ่องสอน',
        'ยโสธร',
        'ยะลา',
        'ร้อยเอ็ด',
        'ระนอง',
        'ระยอง',
        'ราชบุรี',
        'ลพบุรี',
        'ลำปาง',
        'ลำพูน',
        'เลย',
        'ศรีสะเกษ',
        'สกลนคร',
        'สงขลา',
        'สตูล',
        'สมุทรปราการ',
        'สมุทรสงคราม',
        'สมุทรสาคร',
        'สระแก้ว',
        'สระบุรี',
        'สิงห์บุรี',
        'สุโขทัย',
        'สุพรรณบุรี',
        'สุราษฎร์ธานี',
        'สุรินทร์',
        'หนองคาย',
        'หนองบัวลำภู',
        'อ่างทอง',
        'อำนาจเจริญ',
        'อุดรธานี',
        'อุตรดิตถ์',
        'อุทัยธานี',
        'อุบลราชธานี',
    ];

    console.log("provinceName");
    console.log(provinceName.length);
    for (let i = 0; i < provinceName.length; i++) {
        name = provinceName[i];
        const lastID = await getLastID('province_list');
        await db.collection('province_list').add({
            "id": lastID,
            "name": name,
            "postCode": postCode
        });
    }


    return response.json({ status: true, msg: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
});

exports.createProvince = functions.firestore.document('province_list/{provinceID}').onCreate(async (snap, context) => {
    const newValue = snap.data();
    newValue.objectID = snap.id;
    var client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

    var index = client.initIndex(ALGOLIA_INDEX_NAME);
    index.saveObject(newValue);
    console.log('createProvince done');
});

exports.updateProvince = functions.firestore.document('province_list/{provinceID}').onUpdate(async (snap, context) => {
    const afterUpdate = snap.after.data();
    afterUpdate.objectID = snap.after.id;
    var client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

    var index = client.initIndex(ALGOLIA_INDEX_NAME);
    index.saveObject(afterUpdate);
    console.log('updateProvince done');
});

exports.deleteProvince = functions.firestore.document('province_list/{provinceID}').onDelete(async (snap, context) => {
    const oldID = snap.id;
    var client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

    var index = client.initIndex(ALGOLIA_INDEX_NAME);
    index.deleteObject(oldID);
    console.log('deleteProvince done');
});

exports.uploadPhoto = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const photoData = req.body.photo;
        const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`; // Generate a unique filename for the photo

        // Create a buffer from the base64 photo data
        const photoBuffer = Buffer.from(photoData, 'base64');

        const bucket = storage.bucket();
        const fileUpload = bucket.file(`photos/${filename}`);
        const fileStream = fileUpload.createWriteStream({ contentType: 'image/jpeg' }); // Replace 'image/jpeg' with the actual content type of the photo if needed

        fileStream.on('error', (error) => {
            console.error('Error uploading photo:', error);
            res.status(500).send('Error uploading photo.');
        });

        fileStream.on('finish', async () => {
            try {
                // Make the photo publicly accessible
                await fileUpload.makePublic();

                const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
                res.status(200).send(url);
            } catch (error) {
                console.error('Error making photo public:', error);
                res.status(500).send('Error making photo public.');
            }
        });

        fileStream.end(photoBuffer);
    } catch (error) {
        console.error('Error processing photo upload:', error);
        res.status(500).send('Error processing photo upload.');
    }
});

exports.uploadPhotoAndGetURL = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const photoData = req.body.photo;

        const arrPhoto = photoData.split(",");
        console.log("arrPhoto.length");
        console.log(arrPhoto.length);

        const arrUrl = [];

        for (var i = 0; i < arrPhoto.length; i++) {
            var url = await uploadingFile(arrPhoto[i]);
            arrUrl.push(url);
        }

        try {
            console.log("success");
            console.log(arrUrl);
            res.status(200).send(arrUrl.join(","));
        } catch (error) {
            console.error('Error making photo public:', error);
            res.status(500).send('Error making photo public.');
        }


    } catch (error) {
        console.error('Error processing photo upload:', error);
        res.status(500).send('Error processing photo upload.');
    }
});

async function uploadingFile(arrPhoto) {
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`; // Generate a unique filename for the photo

    // Create a buffer from the base64 photo data
    const photoBuffer = Buffer.from(arrPhoto, 'base64');

    const bucket = storage.bucket();
    const fileUpload = bucket.file(`photos/${filename}`);
    const fileStream = fileUpload.createWriteStream({ contentType: 'image/jpeg' }); // Replace 'image/jpeg' with the actual content type of the photo if needed

    const uploadPromise = new Promise((resolve, reject) => {
        fileStream.on('error', (error) => {
            reject(error);
        });

        fileStream.on('finish', async () => {
            try {
                await fileUpload.makePublic();
                const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
                resolve(url);
            } catch (error) {
                reject(error);
            }
        });

        fileStream.end(photoBuffer);
    });
    var rs = await uploadPromise;
    return rs;
}

exports.dataList = functions.region(REGION).https.onRequest(async (request, response) => {

    const snapshot = await db.collection('data_list').get();
    if (snapshot.empty) {
        return response.json({ status: false, msg: 'ไม่มีข้อมูล', data: [] });
    }
    let dataList = [];
    snapshot.docs.forEach((e) => {
        dataList[dataList.length] = {
            id: e.ref.id,
            name: e.data().name,
            detail: e.data().detail,
            searchText: e.data().searchText,
            is_check: e.data().is_check,
        }
    })
    return response.json({ status: true, msg: '', data: dataList });
});

exports.dataListDel = functions.region(REGION).https.onRequest(async (request, response) => {

    const docID = request.query.docID ?? '';

    if(isEmpty(docID)){
        return response.json({ status: false, msg: 'ไม่มีข้อมูล' });
    }

    var rs = await db.collection('data_list').doc(docID).get();

    if(!rs.exists){
        return response.json({ status: false, msg: 'ไม่มีข้อมูล : ' + docID });
    }

    db.doc(rs.ref.path).delete();

    return response.json({ status: true, msg: 'ลบข้อมูลเรียบร้อยแล้ว' });
});

exports.dataListCheck = functions.region(REGION).https.onRequest(async (request, response) => {

    const docID = request.query.docID ?? '';

    if(isEmpty(docID)){
        return response.json({ status: false, msg: 'ไม่มีข้อมูล' });
    }

    var rs = await db.collection('data_list').doc(docID).get();

    if(!rs.exists){
        return response.json({ status: false, msg: 'ไม่มีข้อมูล : ' + docID });
    }

    db.collection('data_list').doc(docID).update({"is_check" : rs.data().is_check ? false : true});

    return response.json({ status: true, msg: 'ลบข้อมูลเรียบร้อยแล้ว' });
});
