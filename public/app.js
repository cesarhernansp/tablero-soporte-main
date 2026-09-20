//const { createElement } = require("react");

// URL de la API. La levanta json-server cuando corres `npm run api`.
const API_URL = 'http://localhost:3000/tickets';

// Estado de la aplicación: la lista de tickets tal como la conoce el navegador.
// La pantalla siempre se dibuja a partir de este arreglo.
let tickets = [];

// Tu código empieza aquí.
const listaTickets = document.querySelector("#lista-tickets");

const coloresPrioridad = {
    "baja": "bg-green-100 text-green-800 border-green-300",
    "media": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "alta": "bg-red-100 text-red-800 border-red-300"
};

const ESTADOS = {
  abierto: { 
    etiqueta: 'Abierto', 
    clases: 'bg-sky-100 text-sky-800',
    siguiente: 'en_progreso', // <-- Nuevo campo: ¿A dónde va después?
    textoBoton: 'Empezar'     // <-- Nuevo campo: ¿Qué dice su botón?
  },
  en_progreso: { 
    etiqueta: 'En progreso', 
    clases: 'bg-amber-100 text-amber-800',
    siguiente: 'resuelto',    // Resuelto es el paso final
    textoBoton: 'Marcar resuelto' 
  },
  resuelto: { 
    etiqueta: 'Resuelto', 
    clases: 'bg-emerald-100 text-emerald-800',
    siguiente: 'resuelto',          // No hay más estados después
    textoBoton: '' 
  },
};

let estado = "creando";
let idTicketEnEdicion = -1;
let textoBusqueda = "";
const contenedorMensaje = document.querySelector("#mensaje");
const filtro = document.querySelector("#filtro-estado");
const buscador = document.querySelector("#busqueda");
const formularioTicket = document.querySelector("#form-ticket");
const tituloFormulario = document.querySelector("#titulo-formulario");
const nombreTituloForm = document.querySelector("#titulo");
const descripcionForm = document.querySelector("#descripcion");
const solicitanteForm = document.querySelector("#solicitante")
const botonCancelar = document.querySelector("#btn-cancelar");
const botonGuardar = document.querySelector("#btn-guardar");
const resumen = document.querySelector("#resumen");

function renderizarTickets()
{   
    let contador = 0;
    contenedorMensaje.textContent = "";
    contenedorMensaje.className = "hidden";

    if (tickets.length === 0) 
    {
        contenedorMensaje.textContent = "No hay tickets registrados ¡Sé el primero en crear uno nuevo usando el formulario de arriba!";
        contenedorMensaje.className = "m-4 p-4";
        return;
    }
    listaTickets.innerHTML = "";

    tickets.forEach(element => 
    {
        if(
        ((filtro.value === "todos")||(element.estado == filtro.value))
        && (element.titulo.toLowerCase().includes(textoBusqueda)))
        {
            contador=contador+1;

            const ticket = document.createElement("section");
            const contenido = document.createElement("div");
            const estado = element.estado.replace('_', ' ');    
            let colorPrioridad = coloresPrioridad[element.prioridad];
            if(element.estado === "resuelto")
            {
                colorPrioridad= "bg-gray-100 text-gray-800 border-gray-300";
            }
            const fondoTarjeta=colorPrioridad;
            const infoEstado = ESTADOS[element.estado];

            contenido.textContent= `#${element.id} Titulo: 
            ${element.titulo} Descripcion: 
            ${element.descripcion} Solicitante: 
            ${element.solicitante} Categoria: 
            ${element.categoria} Prioridad: 
            ${element.prioridad} Estado: 
            ${estado} `;
            
            const contenedorBotones = document.createElement("div");
            contenedorBotones.className = "flex flex-wrap gap-2 mt-auto";

            const editarButton = crearBotonEditar(element);
            contenedorBotones.appendChild(editarButton);

            const borrarButton = crearBotonEliminar(element); 
            contenedorBotones.appendChild(borrarButton);

            if(element.estado !== 'resuelto')
            {
                const tickbutton = crearBotonNextEstado(infoEstado, element);
                contenedorBotones.appendChild(tickbutton);
            }

            ticket.className = `flex flex-col py-4 px-2 ${fondoTarjeta} border-black-200 border-2 m-2`;
            ticket.appendChild(contenido);
            ticket.appendChild(contenedorBotones);

            listaTickets.appendChild(ticket);
            }
        });

        if(contador===0)
        {
            contenedorMensaje.textContent="NO HAY TICKETS CON SUS FILTROS DE BUSQUEDA";
            contenedorMensaje.className = "p-4 ";
        }
        resumen.textContent = `Hay ${contador} tickets`;
}

async function cargarTickets()
{   
    contenedorMensaje.textContent = "**Cargando:**";
    try{
        const respuesta = await fetch(`${API_URL}`);
        if(!respuesta.ok){
        throw new Error(`La API respondió ${respuesta.status}`);
        }
        const info = await respuesta.json();
        tickets = info;
        renderizarTickets();
    }catch(error)
    {
        throw error;
    }
}


async function crearTicket(evento)
{
    evento.preventDefault();

    const valorTitulo = document.querySelector("#titulo").value.trim();
    const valorSolicitante = document.querySelector("#solicitante").value.trim();
    const valorDescripcion = document.querySelector("#descripcion").value;
    const valorCategoria = document.querySelector("#categoria").value;
    const valorPrioridad = document.querySelector("#prioridad").value;

    let estadoActualTicket = "abierto"; 
    if (estado === "editando") {
        const ticketViejo = tickets.find(t => t.id === idTicketEnEdicion);
        if (ticketViejo) estadoActualTicket = ticketViejo.estado;
    }

    const datosTicket = {
        titulo: valorTitulo,
        descripcion: valorDescripcion,
        solicitante: valorSolicitante,
        categoria: valorCategoria,
        prioridad: valorPrioridad,
        estado: estadoActualTicket 
    };

    let method = "POST";
    let url = `${API_URL}`;

    if(estado ==="editando")
    {
        method="PUT";
        url = `${API_URL}/${idTicketEnEdicion}`;
    }

    try
    {
        const respuestaP = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datosTicket)
        })

        if (!respuestaP.ok) {
            throw new Error("Error al intentar guardar el ticket en el servidor.");
        }

        const ticketConId = await respuestaP.json();

        if(method==="POST"){
            //console.log("lo que responde")
            //console.log(respuestaP.status);
            tickets.push(ticketConId);
        }else
        {
            const indice = tickets.findIndex(t => t.id === idTicketEnEdicion);
            if (indice !== -1) tickets[indice] = ticketConId;
            idTicketEnEdicion=-1;
            botonGuardar.textContent = "Crear Ticket";
            botonCancelar.classList.add("hidden"); 
            estado = "creando";
            tituloFormulario.textContent = `Crear Ticket`;
        }
        formularioTicket.reset();
        renderizarTickets();
    }catch(error)
    {
        console.error("Error en la petición POST:", error);
        throw error;
    }

    
}


function crearBotonNextEstado(infoEstado, tick)
{
    const botonAvanzar = document.createElement("button");
    botonAvanzar.textContent = infoEstado.textoBoton;
    botonAvanzar.className = "rounded-full bg-green-300 hover:bg-green-500 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 active:bg-green-800  m-3 p-3";
    botonAvanzar.addEventListener("click", async () => 
    {
        const proximoEstado = infoEstado.siguiente;

        try {
            const respuestaPatch = await fetch(`${API_URL}/${tick.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ estado: proximoEstado }) 
            });

            if (!respuestaPatch.ok) throw new Error("No se pudo actualizar el estado");

            const ticketActualizado = await respuestaPatch.json();

            const indice = tickets.findIndex(t => t.id === tick.id);
            if (indice !== -1) {
                tickets[indice] = ticketActualizado;
            }
            renderizarTickets();

        } catch (error) {
            throw error;
        }
    });

    return botonAvanzar;
}

function crearBotonEditar(ticket)
{
    const botonEditar = document.createElement("button");
    botonEditar.textContent = "Editar";
    botonEditar.className = "rounded-full bg-green-300 hover:bg-green-500 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 active:bg-green-800  m-3 p-3";

    botonEditar.addEventListener("click", ()=>{
        tituloFormulario.textContent = `Editar ticket #${ticket.id}`
        nombreTituloForm.value = ticket.titulo;
        descripcionForm.value = ticket.descripcion;
        solicitanteForm.value = ticket.solicitante;
        botonCancelar.classList.remove("hidden");
        botonGuardar.textContent = "Guardar";
        idTicketEnEdicion = ticket.id;
        estado = "editando";
    })

    return botonEditar;

}

function crearBotonEliminar(ticket)
{
    const botonEliminar = document.createElement("button");
    botonEliminar.textContent = "Eliminar";
    botonEliminar.className = "rounded-full bg-green-300 hover:bg-green-500 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 active:bg-green-800  m-3 p-3";

    botonEliminar.addEventListener("click", async ()=>{
    
        if(window.confirm())
            {
                try {
                    const respuesta = await fetch(`${API_URL}/${ticket.id}`, {
                        method: "DELETE"
                    });

                    if (!respuesta.ok) throw new Error("No se pudo Eliminar");

                    tickets = tickets.filter(t => t.id !== ticket.id);
                    renderizarTickets();

                } catch (error) {
                    console.error("Error en el PATCH:", error);
                    alert("No se pudo cambiar el estado del ticket.");
                }
            }
            
    })
    return botonEliminar;
}

buscador.addEventListener("input", (evento)=>
{   
    textoBusqueda = evento.target.value.toLowerCase().trim();
    renderizarTickets();
});

botonCancelar.addEventListener("click", ()=>
{
    tituloFormulario.textContent = `Crear Ticket`;
    nombreTituloForm.value = "";
    descripcionForm.value = "";
    solicitanteForm.value = "";
    botonCancelar.classList.add("hidden");
    botonGuardar.textContent = "Crear Ticket";
    estado = "creando";
});

filtro.addEventListener("change", ()=>
{
    contador=0;
    renderizarTickets();
});

formularioTicket.addEventListener("submit", crearTicket);

document.addEventListener('DOMContentLoaded', cargarTickets);



