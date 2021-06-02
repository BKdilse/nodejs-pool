"use strict";

const lmdb = require('node-lmdb');

const argv = require('minimist')(process.argv.slice(2));

if (!argv.dir) {
	console.error("Please specify output lmdb dir");
	process.exit(1);
}

if (!argv.size) {
	console.error("Please specify output lmdb size in GB");
	process.exit(1);
}

require("../init_mini.js").init(function() {
        let env2 = new this.lmdb.Env();
        env2.open({
            path: argv.dir,
            maxDbs: 10,
            mapSize: argv.size * 1024 * 1024 * 1024,
            useWritemap: true,
            maxReaders: 512
        });
        let shareDB2 = this.env.openDbi({
            name: 'shares',
            create: true,
            dupSort: true,
            dupFixed: false,
            integerDup: true,
            integerKey: true,
            keyIsUint32: true
        });
        let blockDB2 = this.env.openDbi({
            name: 'blocks',
            create: true,
            integerKey: true,
            keyIsUint32: true
        });
        let altblockDB2 = this.env.openDbi({
            name: 'altblocks',
            create: true,
            integerKey: true,
            keyIsUint32: true
        });
        let cacheDB2 = this.env.openDbi({
            name: 'cache',
            create: true
        });

	console.log("Copying blocks");
	{
		let txn = global.database.env.beginTxn({readOnly: true});
        	let txn2 = env2.beginTxn();
		let cursor = new global.database.lmdb.Cursor(txn, global.database.blockDB);
		for (let found = cursor.goToFirst(); found; found = cursor.goToNext()) {
       		 	cursor.getCurrentBinary(function(key, data) {
 				txn2.putBinary(global.database.blockDB, key, data);
			});
		}
		cursor.close();
	        txn.commit();
                txn2.commit();
	}

	console.log("Copying altblocks");
	{	let txn = global.database.env.beginTxn({readOnly: true});
		let txn2 = env2.beginTxn();
		let cursor = new global.database.lmdb.Cursor(txn, global.database.altblockDB);
		for (let found = cursor.goToFirst(); found; found = cursor.goToNext()) {
        		cursor.getCurrentBinary(function(key, data) {
				txn2.putBinary(global.database.altblockDB, key, data);
			});
		}
		cursor.close();
	        txn.commit();
                txn2.commit();
	}

 	console.log("DONE");
	process.exit(0);
});
