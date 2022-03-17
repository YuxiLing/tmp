import esprima from 'esprima'
import fs from 'fs';

function begin() {
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

    function traverse_file(dir,handle_ast_file) {
        var js_file = walk(dir);

        js_file.forEach(function (p) {
            if (p.slice(-3) == ".js") {
                // console.log(p);
                var output = p.slice(0, -3) + '_temp.json'
                handle_ast_file(p, output,traverse);
            }
        });

        return;
    }
    function handle_ast_file(input_file, output_file,traverse) {
        var data= fs.readFileSync(input_file, { encoding: 'utf-8' });
        
        try {
            var node=esprima.parseScript(data);
            
            var reached_node = []
            var called_api = []

            traverse(node, reached_node, called_api,handle_ast_node);
            console.log(called_api);

            success = success + 1;
            console.log(success);
        } catch (e) {
            // console.error('skip a file' + input_file);
            // console.log(e);
            failed = failed + 1;
        }
        
        // var code = fs.readFile(input_file, {encoding: 'utf-8'});
        // var ast = esprima.parseScript(code);
        // traverse(ast,handle_ast_node);
    }
    function traverse(node, reached_node, called_api,handle_ast_node) {
        handle_ast_node(node, reached_node, called_api)
        
        // console.log('inside '+called_api);

        for (var key in node) { //2
            if (node.hasOwnProperty(key)) { //3
                var child = node[key];
                if (typeof child === 'object' && child !== null) { //4

                    if (Array.isArray(child)) {
                        child.forEach(function (node) { //5
                            reached_node.push(node);
                            traverse(node, reached_node, called_api,handle_ast_node)

                            reached_node.pop();

                        });
                    } else {
                        reached_node.push(child);
                        traverse(child, reached_node, called_api,handle_ast_node)
                        
                        //6
                        reached_node.pop();
                    }
                }
            }
        }
        // return called_api;
    }

    function handle_ast_node(node, reached_node, called_api) {
        // console.log('handle ast node '+called_api);
        if (node.type == "CallExpression" && node.callee.type == "MemberExpression" && node.callee.object.object.name == "chrome") {
            //this is a start of a chrome API calle
            // three layers
            var api_name = node.callee.object.object.name + "." + node.callee.object.property.name + "." + node.callee.property.name;
            var api_argument = node.arguments;
            // called_api.push(JSON.stringify({"name":api_name,"argument":api_argument}));
            var tmp={ "name": api_name, "argument": api_argument };
            called_api.push(tmp);
            console.log('74'+called_api);
        } else if (node.type == "CallExpression" && node.callee.type == "MemberExpression" && node.callee.object.type == "MemberExpression" && node.callee.object.object.object.name == "chrome") {
            //this is a start of a chrome API calle
            // four layers
            var api_name = node.callee.object.object.object.name + "." + node.callee.object.object.property.name + "." + node.callee.object.property.name + "." + node.callee.property.name;
            var api_argument = node.arguments;
            // called_api.push(JSON.stringify({"name":api_name,"argument":api_argument}));
            var tmp={ "name": api_name, "argument": api_argument };
            called_api.push(tmp);
            console.log('74'+called_api);
        }
        // console.log('74'+called_api);
        // return called_api;

    }
    function print_info() {
        console.log('failed' + failed);
        console.log('success' + success);
        return;
    }
    var success = 0;
    var failed = 0;

    // print_info();
    traverse_file('sample_ext/process',handle_ast_file);
    print_info();
}
begin();

// var input_file="sample_ext/process/bhghoamapcdpbohphigoooaddinpkbai/dist/import.js";
// var output_file="";
// handle_ast_file(input_file,output_file)