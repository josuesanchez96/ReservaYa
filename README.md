# ReservaYa - API de Reservación de Salas

[![CI Pipeline](https://github.com/yoelfme/sqa-finde-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/yoelfme/sqa-finde-2026/actions)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![Vitest](https://img.shields.io/badge/Vitest-3.0-green.svg)
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen.svg)

API de reservación de salas desarrollada en **TypeScript** aplicando **Clean Architecture**, persistencia en memoria y una suite automatizada con **Vitest** respaldada por un flujo de **Integración Continua (CI)** en **GitHub Actions**.

---

## Arquitectura del Proyecto

El proyecto sigue estrictamente la separación de responsabilidades de **Clean Architecture**:

```
ReservaYa/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Workflow de CI en GitHub Actions
├── src/
│   ├── domain/                    # Lógica pura de negocio y contratos
│   │   ├── entities/              # Room y Reservation
│   │   ├── value-objects/         # DateInterval (operaciones de fechas y traslapes)
│   │   ├── errors/                # Excepciones de dominio personalizadas
│   │   └── repositories/          # Interfaces de repositorios (IRoomRepository, IReservationRepository)
│   ├── infrastructure/            # Implementaciones de almacenamiento
│   │   └── repositories/          # InMemoryRoomRepository e InMemoryReservationRepository
│   ├── application/               # Casos de uso
│   │   └── services/              # RoomReservationService
│   └── index.ts                   # Exportación de módulos
├── tests/
│   ├── unit/                      # Pruebas unitarias de dominio, servicio y repositorios
│   │   ├── domain-and-infra.spec.ts
│   │   └── room-reservation.service.spec.ts
│   └── integration/               # Prueba de integración real sin mocks
│       └── room-reservation.integration.spec.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── vitest.config.ts               # Configuración de Vitest V8 y umbrales de cobertura
```

---

##  Comportamientos y Reglas de Negocio

1. **Registrar Salas (`registerRoom`)**: Valida que el nombre de la sala no esté vacío y que la capacidad sea estrictamente positiva (`> 0`).
2. **Crear Reservación (`createReservation`)**:
   - Valida que el intervalo de fechas sea válido (`endDate > startDate`).
   - Verifica la existencia de la sala.
   - Rechaza si el número de asistentes supera la capacidad de la sala o es `<= 0`.
   - Rechaza si existe un traslape de fechas con otra reservación activa en la misma sala.
   - Maneja el caso borde de límites exactos (ej. `10:00-11:00` y `11:00-12:00` **no** se traslapan).
3. **Cancelar Reservación (`cancelReservation`)**: Marca la reservación como `CANCELLED` y libera el intervalo de tiempo.
4. **Consultar Disponibilidad (`checkAvailability`)**: Indica si una sala está libre para un intervalo específico.

---

## Instalación y Comandos Locales

### Requisitos
- **Node.js** v20 o v24
- **pnpm** v9+

### Pasos

1. **Instalar dependencias reproducibles**:
   ```bash
   pnpm install --frozen-lockfile
   ```

2. **Ejecutar las pruebas unitarias e integración**:
   ```bash
   pnpm test
   ```

3. **Ejecutar reporte de cobertura**:
   ```bash
   pnpm test:coverage
   ```
   *Esto generará la carpeta `coverage/` con reportes en consola, HTML (`coverage/index.html`) y LCOV (`coverage/lcov.info`).*

---

## Reporte de Cobertura de Código

| Métrica | Cobertura Obtenida | Umbral Mínimo |
| :--- | :---: | :---: |
| **Statements** | **100 %** (207/207) | 80 % |
| **Branches** | **100 %** (71/71) | 80 % |
| **Functions** | **100 %** (33/33) | 80 % |
| **Lines** | **100 %** (207/207) | 80 % |

---

## Integración Continua (GitHub Actions)

El archivo [`.github/workflows/ci.yml`](.github/workflows/ci.yml) automatiza las verificaciones en cada `push` o `pull_request` a las ramas principales:

* **Runner**: `ubuntu-latest` (Linux).
* **Permisos**: `contents: read`.
* **Pasos**:
  1. Checkout del código.
  2. Setup de `pnpm` y `Node.js 24` con caché.
  3. Instalación reproducible con `pnpm install --frozen-lockfile`.
  4. Ejecución del *coverage gate* con `pnpm test:coverage`.
  5. Carga del reporte de cobertura como artefacto en GitHub Actions (`if: always()`).

---

## Guía de Evaluación

### Respuestas Teóricas

1. **¿Por qué las 4 métricas de cobertura pueden mostrar porcentajes diferentes?**
   - **Statements**: Porcentaje de declaraciones procesadas.
   - **Lines**: Porcentaje de líneas físicas recorridas (varias declaraciones pueden estar en una línea).
   - **Functions**: Porcentaje de funciones invocadas.
   - **Branches**: Porcentaje de caminos condicionales evaluados en `if/else`, ternarios y conectores lógicos (`&&`, `||`).

2. **Riesgo de la métrica Branches con menor cobertura**:
   Indica que aunque el código se ejecute en escenarios normales ("happy path"), existen caminos de manejo de excepciones o condiciones de borde no evaluadas, aumentando el riesgo de errores inesperados en producción.

3. **Limitación de las métricas de cobertura**:
   La cobertura garantiza ejecución de líneas, pero no la validez de los requerimientos de negocio ni la efectividad de las aserciones (`expect()`).
