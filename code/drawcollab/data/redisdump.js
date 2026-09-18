// hash for output file name
// get users from redis
// for 0 to users number, get list of items
// if items, insert as new row
// each item + 1 = x, y in column
// write to file with hash
// print output file name

var fs = require("fs");
var exec = require("child_process").exec;

let hash = Math.round(Math.random() * 10000);
let count = 0;
let all = { total: 0, data: [] };
let u;

let debug = process.argv.length > 2 && process.argv[2] == "debug";

function o(val) {
  if (debug) o(val);
}

function incr() {
  count += 1;
  o(`${count} processed of ${u}`);
  if (count == u) {
    o(`final entry calculated, processing data`);
    o(all);
    processData(all);
  }
}

String.prototype.float = function() {
  return parseFloat(this.replace('"', ""));
};

let commands = {
  users: "redis-cli GET users",
  datas: key => `echo "${key}";redis-cli --csv lrange ${key} 0 -1`
};

o(`issuing command: ${commands.users}`);

exec(commands.users, function(error, stdout, stderr) {
  if (error) {
    o(`err0: ${error.code}`);
  }

  u = parseInt(stdout);
  o(`got ${u} entries`);

  for (i = 0; i < u; i += 1) {
    o(`getting entry: ${i}`);

    let v = {
      /* id, total, vertices */
    };

    o(`issuing command: ${commands.datas(i)}`);
    exec(commands.datas(i), function(error, stdout, stderr) {
      if (error) {
        o(`err1: ${error.code}`);
        incr();
        return;
      }

      if (!stdout || stdout == null) {
        o(`command returned null values`);
        incr();
        return;
      }

      let out = stdout.split("\n");
      let id = out[0];

      let d = out[1].split(",");
      if (!d || d.length <= 1) {
        o(`entry ${id} has no values`);
        incr();
        return;
      }

      o(`entry ${id} has ${d.length} values`);

      v.entry = id;
      v.id = Math.round(Math.random() * 10000);
      v.vertices = [];

      let vertex = {};
      for (j = 0; j < d.length; j += 1) {
        o(`processing value: ${d[j]}, is type of ${typeof d[j]}`);
        let num = d[j].float();
        o(`got number: ${num}`);
        if (j % 2 == 0) {
          vertex.x = num;
        } else {
          vertex.y = num;
          v.vertices.push(vertex);
        }
      }

      all.data.push(v);
      all.total += 1;
      v.total = v.vertices.length;

      o(`entry ${id} has ${v.total} coordinates`);

      incr();
      return;
    });
  }
});

function processData(data) {
  fs.writeFile(
    `redis_data_dump_${hash}.json`,
    JSON.stringify(data, null, 4),
    function(err) {
      if (err) {
        o(`err2: ${error.code}`);
      }

      o(`redis_data_dump_${hash}.json was saved!`);
      console.log(`redis_data_dump_${hash}.json`);
    }
  );

  /* CSV is weird

  let largest = (() => {
    let largest = 0;
    data.data.forEach(el => {
      largest = el.total > largest ? el.total : largest;
    });
    return largest;
  })();

  o(`Laregest value is: ${largest}`);



  let csv = "entry,";
  for (i = 0; i < largest; i++) {
    csv += `${i},`;
  }

  data.data.forEach(el => {
    o(`inserting: ${el}`);
    csv += `${el.id},`;
    for (j = 0; j < el.total; j++) {
      csv += `${el.vertices[j].x}:${el.vertices[j].y},`;
    }

    for (z = 0; z < largest - el.total; z++) {
      csv += ",";
    }
  });

  //   o(csv);

  fs.writeFile(`${hash}.csv`, csv, function(err) {
    if (err) {
      o(`err2: ${error.code}`);
    }

    o(`${hash}.csv was saved!`);
  });
  */
}
