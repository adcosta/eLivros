/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/*
 * Funções auxiliares para mostrar mensagens de erro e de debug...
 *  - v1.0 apenas mostra a mensagem com um estilo próprio durante 10 segundos
 */
function msgErro(txt) {
    // coloca mensagem de erro no parágrafo de avisos...
    $(avisos).text(txt);
    // limpa mensagem daqui a 10 segundos...
    setTimeout(function () {
        $(avisos).empty();
    }, 10000);
}

function msgDebug(txt) {
    $(debug).text(txt);
    setTimeout(function () {
        $(debug).empty();
    }, 10000);
}

/*
 * Variaveis globais do módulo
 *   - dbLivros: instância da base de dados eLivros
 *   - eLivro: o livro que esteja seleccionado
 *   - eBiblioteca: conjunto de livros inicial
 */
var dbLivros;
var eBibliotecaBase = [
    {id: "01", autor: "Luís de Camões", titulo: "Os Lusíadas"},
    {id: "02", autor: "Eça de Queirós", titulo: "Os Maias"}
];

/*
 * On document load... open Db... populate it
 */
window.onload = function () {
    // browsers que ainda usam prefixos esquisitos precisam disto
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"};
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    // testa se i browser suporta ou não o IndexDB
    if (!window.indexedDB) {
        window.alert("Este browser não suporta o IndexedDB.");
        return;
    }

    // Abrir a base de dados... elivros
    var DBOpenRequest = window.indexedDB.open("eLivros", 4);

    // Vamos definir dois handlers para os eventos de sucesso e insucesso
    DBOpenRequest.onerror = function (event) {
        msgErro("Erro a abrir a base de dados de livros");
    };

    DBOpenRequest.onsuccess = function (event) {
        msgDebug("Base de dados de livros acessivel...");
        // guardar o resultado na variavel 'dbLivros' para usar mais tarde
        dbLivros = DBOpenRequest.result;
        // e atualiza a lista de livros...
        listaLivros();
    };

    // Finalmente um handler para "upgrade" que será usado para
    // 1) Criar a base de dados, caso não exista
    // 2) atualizar a versão, caso se faça open com um novo número de versão

    DBOpenRequest.onupgradeneeded = function (event) {
        var db = event.target.result;

        db.onerror = function (event) {
            msgErro("Erro na abertura da base de dados de livros");
        };

        // criar a nova base de dados... com chave id e campos autor e titulo
        var objectStore = db.createObjectStore("eLivros", {keyPath: "id"});
        objectStore.createIndex("autor", "autor", {unique: false});
        objectStore.createIndex("titulo", "titulo", {unique: false});

        // insere alguns dados na BD... qiando a criação da DB terminar...
        objectStore.transaction.oncomplete = function (event) {
            var transaction = dbLivros.transaction(["eLivros"], "readwrite");
            var elivrosObjectStore = transaction.objectStore('eLivros');
            for (var i in eBibliotecaBase) {
                elivrosObjectStore.add(eBibliotecaBase[i]);
            }
        };
        // e avisa que está tudo bem...
        msgDebug("Uma nova versão da Base de Dados de eLivros foi criada");
    };
};

/*
 * Os livros são listados numa tabela HTML de 4 colunas de nome "tabela_livros"
 * Esta funcao adiciona uma nova linha a essa tabela
 * Parametro de entrada: um livro 
 */
function acrescentaLivroTabela(eLivro) {
    var tabela = $("#tabela_livros tbody");
    console.log(JSON.stringify(eLivro))
    $('<tr></tr>')
            .append('<td>' + eLivro.id + '</td>')
            .append('<td>' + eLivro.titulo + '</td>')
            .append('<td>' + eLivro.autor + '</td>')
            .append('<td> <input type="button" value="Apaga" id="' + eLivro.id +
                    '" onclick="apagaLivro(\'' + eLivro.id + '\')"> </td>')
            .appendTo(tabela)
            .fadeIn("slow");
}

/*
 * limpa a listagem dos livros (esvazia a tabela HTML, não a base de dados)...
 */
function limpaTabelaLivros() {
    var tabela = $("#tabela_livros tbody");
    tabela.empty();
    // limpa variaveis do footer...
    $('#id').val('');
    $('#titulo').val('');
    $('#autor').val('');
}

/*
 * Obtem todos os livros guardados no IndexDB e lista-os numa tabela HTML
 */
function listaLivros() {
    // antes de listar de novo os livros, apagar a tabela exibida...
    limpaTabelaLivros();

    // abrir a base de dados e navegar pelos livros um a um...
    var transaction = dbLivros.transaction(["eLivros"], "readwrite");
    var objectStore = transaction.objectStore('eLivros');
    var dbCursor = objectStore.openCursor();
    dbCursor.onerror = function (event) {
        msgErro("Não foi possível obter dados da Base de Dados de Livros");
    };

    dbCursor.onsuccess = function (event) {
        var cursor = event.target.result;
        // fazer algo se ainda tivermos cursor...
        if (cursor) {
            // mostra este elemento na tabela...
            acrescentaLivroTabela(cursor.value);
            // ...e avança para o próximo 
            cursor.continue();
        }

    };
}

/*
 * ObtemLivro: pesquisa livro por Id e coloca-o na linha de edição
 */
function obtemLivro() {
    // vai buscar o valor que o utilizador introduziu
    var id = $('#id').val();
    // procura na base de dados se for diferente de null
    if (id) {
        var transaction = dbLivros.transaction(["eLivros"], "readwrite");
        var objectStore = transaction.objectStore('eLivros');
        var objectStoreRequest = objectStore.get(id);
        objectStoreRequest.onerror = function (event) {
            msgErro("Erro na procura do livro....");
        };
        objectStoreRequest.onsuccess = function (event) {
            if (objectStoreRequest.result) {
                // encontrado: coloca valores na linha de edição
                $('#id').val(objectStoreRequest.result.id);
                $('#titulo').val(objectStoreRequest.result.titulo);
                $('#autor').val(objectStoreRequest.result.autor);
                msgDebug("Livro encontrado! Já existe...");
            } else {
                // nao encontrado: limpa linha de edição
                $('#id').val(id);
                $('#titulo').val('');
                $('#autor').val('');
                msgDebug("Livro não encontrado...");
            }
            ;
        };
    } else {
        msgErro("Introduza um id de livro para iniciar a pesquisa...");
    }
};

/*
 * AdicionaLivro: adiciona um novo livro a partir dos dados introduzidos
 */
function adicionaLivro() {
    var eLivro = { id: "", titulo: "", autor: ""};
    eLivro.id = $('#id').val();
    eLivro.titulo = $('#titulo').val();
    eLivro.autor = $('#autor').val();

    if (eLivro.id && eLivro.titulo && eLivro.autor) {
        var objectStore = dbLivros.transaction(["eLivros"], "readwrite").objectStore('eLivros');
        var request = objectStore.add(eLivro);
        request.onerror = function (event) {
            // nao adicionou
            msgErro("Não foi possivel adicionar esse livro....");
        };
        request.onsuccess = function (event) {
            // adicionou: limpa linha de edição
            acrescentaLivroTabela(eLivro);
            $('#id').val('');
            $('#titulo').val('');
            $('#autor').val('');
            msgDebug("Livro adicionado! ");
        };
    } else {
        msgErro("Dados do livro incompletos: preencha todos os campos...");
    }
}

/*
 * ApagaLivro: apaga o livro indicado e refaz a listagem corretamente
 */
function apagaLivro(id) {
    if (id) {
        var transaction = dbLivros.transaction(["eLivros"], "readwrite");
        var objectStore = transaction.objectStore('eLivros');
        var request = objectStore.delete(id);
        request.onerror = function (event) {
            msgErro("Não foi possivel remover esse livro....");
        };
        request.onsuccess = function (event) {
            msgDebug("Livro removido com sucesso! ");
            listaLivros();
        };
    } else {
        msgErro("Id do livro não foi especificado");
    }
}

