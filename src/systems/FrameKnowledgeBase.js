/**
 * FrameKnowledgeBase.js
 * 
 * Implementación de un Sistema de Marcos (Frames) para la Representación del Conocimiento.
 * Este modelo nos permite esquematizar las prendas no como simples objetos planos,
 * sino como una jerarquía conceptual donde las propiedades (slots) se heredan.
 */

class Frame {
  constructor(name, parent = null) {
    this.name = name;
    this.parent = parent;
    this.slots = {}; // Los atributos o propiedades
    this.instances = []; // Instancias concretas de este marco
  }

  // Define una propiedad en este marco
  setSlot(key, value) {
    this.slots[key] = value;
  }

  // Recupera una propiedad (busca primero aquí, luego en los padres por herencia)
  getSlot(key) {
    if (this.slots[key] !== undefined) {
      return this.slots[key];
    }
    if (this.parent) {
      return this.parent.getSlot(key);
    }
    return null;
  }

  addInstance(garmentData) {
    this.instances.push(garmentData);
  }

  // Devuelve todas las instancias de este marco y de sus marcos hijos
  getAllInstances() {
    return this.instances;
  }
}

export default class FrameKnowledgeBase {
  constructor(garmentsData) {
    this.frames = {};
    this._buildOntology();
    this._populateInstances(garmentsData);
  }

  _buildOntology() {
    // Concepto raíz
    this.frames['Prenda'] = new Frame('Prenda');

    // Categorías abstractas (Heredan de Prenda)
    const categorias = ['superior', 'inferior', 'calzado', 'accesorio', 'capa', 'conjunto'];
    categorias.forEach(cat => {
      this.frames[cat] = new Frame(cat, this.frames['Prenda']);
      this.frames[cat].setSlot('categoria', cat); // Faceta por defecto
    });
  }

  _populateInstances(garmentsData) {
    garmentsData.forEach(garment => {
      const categoryFrame = this.frames[garment.category];
      if (categoryFrame) {
        // En un sistema puro, la prenda en sí misma sería un sub-marco u objeto instancia
        // Aquí la agregamos como una instancia de su categoría
        categoryFrame.addInstance(garment);
      }
    });
  }

  // Query al motor de inferencia
  getGarmentsByCategory(category) {
    if (this.frames[category]) {
      return this.frames[category].getAllInstances();
    }
    return [];
  }

  // Retorna una estructura Grid (Matriz) para representación visual
  getGridRepresentation() {
    const grid = {};
    Object.keys(this.frames).forEach(key => {
      if (key !== 'Prenda') {
        grid[key] = this.frames[key].getAllInstances().map(g => g.name.es);
      }
    });
    return grid;
  }
}
