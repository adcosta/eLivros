/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


function mudaCor() {
    var doc = document.getElementById("linha2");
    var cor = doc.getAttribute("class");
    if (cor === "fundo_azul") {
        doc.setAttribute("class", "fundo_amarelo");
    } else {
        doc.setAttribute("class", "fundo_azul");
    }
}

function msgErro(txt) {
    // coloca mensagem de erro no parágrafo de avisos...
    $(avisos).text(txt);
    // limpa mensagem daqui a 12 segundos...
    setTimeout(function () {
        $(avisos).empty();
    }, 12000);
}

function msgDebug(txt) {
    $(debug).text(txt);
    setTimeout(function () {
        $(debug).empty();
    }, 12000);
}

function listaLivros() {
    // obtem da local storage...
    
}