import esprima from 'esprima'
import fs from 'fs';
import Step from 'Step';

var walk = function (dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function (file) {
        if (file != '.DS_Store') {
            file = dir + '/' + file;
            var stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory */
                results = results.concat(walk(file));
            } else {
                /* Is a file */
                results.push(file);
            }
        }
    });
    return results;
}
var success = 0;
var failed = 0;

function traverse_file(dir) {
    var js_file = walk(dir);

    js_file.forEach(function (p) {
        if (p.slice(-3) == ".js") {
            // console.log(p);
            var output = p.slice(0, -3) + '_temp.json'
            handle_ast_file(p, output);
        }
    });

    return;
}
let handle_ast_file = function (input_file, output_file) {
    fs.readFile(input_file, { encoding: 'utf-8' }, function (err, data) {
        try {
            esprima.parseScript(data, {}, function (node, meta) {
                let reached_node = []
                let called_api = []

                called_api = traverse(node, reached_node, called_api);
                // console.log(called_api);



            });
            success = success + 1;
            console.log(success);
        } catch (e) {
            // console.error('skip a file' + input_file);
            // console.log(e);
            failed = failed + 1;
        }
    });
    // var code = fs.readFile(input_file, {encoding: 'utf-8'});
    // var ast = esprima.parseScript(code);
    // traverse(ast,handle_ast_node);
}
let traverse = function (node, reached_node, called_api) {
    let new_called_api = handle_ast_node(node, reached_node, called_api)
    called_api = new_called_api;
    // console.log('inside '+called_api);

    for (var key in node) { //2
        if (node.hasOwnProperty(key)) { //3
            var child = node[key];
            if (typeof child === 'object' && child !== null) { //4

                if (Array.isArray(child)) {
                    child.forEach(function (node) { //5
                        reached_node.push(node);
                        new_called_api = traverse(node, reached_node, called_api)
                        called_api = new_called_api

                        reached_node.pop();

                    });
                } else {
                    reached_node.push(child);
                    new_called_api = traverse(child, reached_node, called_api)
                    called_api = new_called_api;
                    //6
                    reached_node.pop();
                }
            }
        }
    }
    return called_api;
}

let handle_ast_node = function (node, reached_node, called_api) {
    // console.log('handle ast node '+called_api);
    if (node.type == "CallExpression" && node.callee.type == "MemberExpression" && node.callee.object.object.name == "chrome") {
        //this is a start of a chrome API calle
        // three layers
        var api_name = node.callee.object.object.name + "." + node.callee.object.property.name + "." + node.callee.property.name;
        var api_argument = node.arguments;
        // called_api.push(JSON.stringify({"name":api_name,"argument":api_argument}));
        called_api.push({ "name": api_name, "argument": api_argument });
        console.log('74'+JSON.stringify(called_api));
    } else if (node.type == "CallExpression" && node.callee.type == "MemberExpression" && node.callee.object.type == "MemberExpression" && node.callee.object.object.object.name == "chrome") {
        //this is a start of a chrome API calle
        // four layers
        var api_name = node.callee.object.object.object.name + "." + node.callee.object.object.property.name + "." + node.callee.object.property.name + "." + node.callee.property.name;
        var api_argument = node.arguments;
        // called_api.push(JSON.stringify({"name":api_name,"argument":api_argument}));
        called_api.push({ "name": api_name, "argument": api_argument });
        console.log('74'+JSON.stringify(called_api));
    }
    // console.log('74'+called_api);
    return called_api;

}
let print_info = function () {
    console.log('failed' + failed);
    console.log('success' + success);
    return;
}

traverse_file('sample_ext/process');
print_info();

// Step(
//     traverse_file('sample_ext/process'),
//     success++,
//     print_info()
// );



// while(true){
//     console.log('failed'+failed);
//     console.log('success'+success);
// }

// var input_file="sample_ext/process/bhghoamapcdpbohphigoooaddinpkbai/dist/import.js";
// var output_file="";
// handle_ast_file(input_file,output_file)