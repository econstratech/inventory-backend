const { Op } = require("sequelize")
const ProductionRoute = require("../model/ProductionRoute")
const ProductionRouteProcess = require("../model/ProductionRouteProcess");
const Product = require("../model/Product");
const ProductCategories = require("../model/ProductCategory");
const MasteruomModel = require("../model/MasteruomModel");
const BOM = require("../model/Bom");
const RawMaterial = require("../model/RawMaterial");
const ScrapItem = require("../model/ScrapItems");
const FinishedGoods = require("../model/FinishedGoods");
const RawMaterialAlternative = require("../model/RawMaterialAlternative");
const Routing = require("../model/routing");
const Store = require("../model/Warehouse");
const FinishedGoodsAlternate =  require("../model/FinishedGoodsAlternate");
const User = require("../model/User");
const { PurchaseProduct, Purchase } = require("../model/Sales"); 
const Customer = require("../model/Customer");
const TrackProductStock = require("../model/TrackProductStock");
const Warehouse = require("../model/Warehouse");
const Production = require("../model/Production");
const ProductionFinishedGoods = require("../model/ProductionFinishedGoods");
const ProductionRawMaterial = require("../model/ProductionRawMaterial");
const ProductionRawMaterialAlternate = require("../model/ProductionRawMaterialAlternate");
const ProductionScrapItems = require("../model/ProductionScrapItems");
const AlternativeMaterial = require("../model/RawMaterialAlternative");
const generateUniqueReferenceNumber = require("../utils/generateReferenceNumber");

const generateRandomBarcode = () => {
    const barcodeLength = 16;
    let barcode = "";
  
    for (let i = 0; i < barcodeLength; i++) {
      barcode += Math.floor(Math.random() * 10); // Generate a digit from 0 to 9
    }
  
    return barcode;
  };
exports.createBOM = async (req, res) => {
    try {
        const { 
            bomNumber, documentName, FGStore, RMStore, ScrapRejectStore, description, attachments,
            comment, labour_charges_amount, labour_charges_comment, machinery_charges_amount,
            machinery_charges_comment, electricity_charges_amount, electricity_charges_comment, 
            other_charges_amount, other_charges_comment, finishedGoods, finishedGoodsAlternate,
            rawMaterials, scrapItems, routing, company_id, user_id 
        } = req.body;

        //  Create BOM record
        const bom = await BOM.create({ 
            bomNumber, documentName, FGStore, RMStore, ScrapRejectStore, description, comment, attachments,
            labour_charges_amount, labour_charges_comment, machinery_charges_amount,
            machinery_charges_comment, electricity_charges_amount, electricity_charges_comment, 
            other_charges_amount, other_charges_comment, company_id, user_id 
        });

        //  Insert Finished Goods
        if (finishedGoods?.length) {
            await FinishedGoods.bulkCreate(
                finishedGoods.map(item => ({
                    bomId: bom.id,
                    product_id: item.product_id,
                    product_code: item.product_code,
                    name: item.name || "N/A",
                    category: item.category || "N/A",
                    quantity: item.quantity,
                    unit: item.unit || "N/A",
                    costAllocation: item.costAllocation,
                    comment: item.comment || "-",
                    company_id, user_id
                }))
            );
        }

        //  Insert Finished Goods Alternate
        if (finishedGoodsAlternate?.length) {
            await FinishedGoodsAlternate.bulkCreate(
                finishedGoodsAlternate.map(item => ({
                    bomId: bom.id,
                    product_id: item.product_id,
                    product_code: item.product_code,
                    name: item.name || "N/A",
                    category: item.category || "N/A",
                    quantity: item.quantity,
                    unit: item.unit || "N/A",
                    costAllocation: item.costAllocation,
                    comment: item.comment || "-",
                    company_id, user_id
                }))
            );
        }

        //  Insert Raw Materials & Child Materials
        if (rawMaterials?.length) {
            const rawMaterialRecords = await RawMaterial.bulkCreate(
                rawMaterials.map(item => ({
                    bomId: bom.id,
                    product_id: item.product_id,
                    product_code: item.product_code,
                    name: item.name || "N/A",
                    category: item.category || "N/A",
                    quantity: item.quantity,
                    unit: item.unit || "N/A",
                    comment: item.comment || "-",
                    company_id, user_id
                })),
                { returning: true } // Ensures we get inserted IDs
            );

            for (let i = 0; i < rawMaterials.length; i++) {
                //  Insert Alternative Raw Materials for Parent
                if (rawMaterials[i].alternative?.length) {
                    await RawMaterialAlternative.bulkCreate(
                        rawMaterials[i].alternative.map(alt => ({
                            rawMaterialId: rawMaterialRecords[i].id,
                            bomId: bom.id,
                            product_id: alt.id,
                            product_code: alt.product_code,
                            name: alt.product_name || "N/A",
                            category: alt.Categories?.title || "N/A",
                            quantity: alt.quantity,
                            unit: alt.Masteruom?.unit_name || "N/A",
                            costAllocation: alt.costAllocation || 0,
                            comment: alt.comment || "-",
                            company_id, user_id
                        }))
                    );
                }

                //  Insert Child Materials
                if (rawMaterials[i].childMaterials?.length) {
                    const childRecords = await RawMaterial.bulkCreate(
                        rawMaterials[i].childMaterials.map(child => ({
                            parentRawMaterialId: rawMaterialRecords[i].id,
                            bomId: bom.id,
                            product_id: child.product_id,
                            product_code: child.product_code,
                            name: child.name || "N/A",
                            category: child.category || "N/A",
                            quantity: child.quantity,
                            unit: child.unit || "N/A",
                            comment: child.comment || "-",
                            company_id, user_id
                        })),
                        { returning: true }
                    );

                    //  Insert Alternative Items for Child Materials
                    for (let j = 0; j < rawMaterials[i].childMaterials.length; j++) {
                        if (rawMaterials[i].childMaterials[j].alternative?.length) {
                            await RawMaterialAlternative.bulkCreate(
                                rawMaterials[i].childMaterials[j].alternative.map(alt => ({
                                  rawMaterialId: childRecords[j].id,
                                  bomId: bom.id,
                                  product_id: alt.product_id || alt.id,
                                  product_code: alt.product_code,
                                  name: alt.name || alt.product_name || "N/A",
                                  category: alt.category || alt.Categories?.title || "N/A",
                                  quantity: alt.quantity,
                                  unit: alt.unit || alt.Masteruom?.unit_name || "N/A",
                                  costAllocation: alt.costAllocation || 0,
                                  comment: alt.comment || "-",
                                  company_id, user_id
                                }))
                              )
                              
                        }
                    }
                }
            }
        }

        //  Insert Scrap Items
        if (scrapItems?.length) {
            await ScrapItem.bulkCreate(
                scrapItems.map(item => ({
                    bomId: bom.id,
                    product_id: item.product_id,
                    product_code: item.product_code,
                    name: item.name || "N/A",
                    category: item.category || "N/A",
                    quantity: item.quantity,
                    unit: item.unit || "N/A",
                    costAllocation: item.costAllocation || 0,
                    comment: item.comment || "-",
                    company_id, user_id
                }))
            );
        }

        //  Insert Routing
        if (routing?.length) {
            await Routing.bulkCreate(
                routing.map(item => ({
                    bomId: bom.id,
                    route_id: item.route_id,
                    route_name: item.route_name,
                    sequence: item.sequence,
                    comment: item.comment || "-",
                    company_id, user_id
                }))
            );
        }

        res.status(201).json({ message: "BOM created successfully", bom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating BOM", error });
    }
};




exports.getBOMById = async (req, res) => {
    try {
        const { bomid } = req.params;
        const company_id = req.user.company_id;

        // Fetch BOM with all related data
        const bom = await BOM.findOne({
            where: { id: bomid, company_id: company_id },
            include: [
                { model: FinishedGoods, as: "finishedGoods" },
                {
                    model: RawMaterial,
                    as: "rawMaterials",
                    include: [
                        {
                            model: RawMaterial,
                            as: "childMaterials",
                            include: [
                                {
                                    model: RawMaterialAlternative,
                                    as: "alternatives" //  Ensure child materials also include alternatives
                                }
                            ]
                        },
                        {
                            model: RawMaterialAlternative,
                            as: "alternatives"
                        }
                    ]
                },
                { model: Routing, as: "routing" },
                { model: ScrapItem, as: "scrapItems" },
                { model: Store, as: "FGStoreDetails" },
                { model: Store, as: "RMStoreDetails" },
                { model: User, as: "UserDetails" },
                { model: User, as: "UserDetailsM" }
            ]
        });

        if (!bom) {
            return res.status(404).json({ message: "BOM not found" });
        }

        //  Separate Parent and Child Raw Materials
        const rawMaterials = bom.rawMaterials.filter(rm => rm.parentRawMaterialId === 0);
        const childMaterials = bom.rawMaterials.filter(rm => rm.parentRawMaterialId !== 0);

        //  Attach Child Materials & Their Alternatives to Their Parent
        rawMaterials.forEach(parent => {
            parent.childMaterials = childMaterials
                .filter(child => child.parentRawMaterialId === parent.id)
                .map(child => ({
                    ...child.toJSON(),
                    alternatives: child.alternatives || [] // ✅ Ensure alternatives are included
                }));
        });

        const scrapCount = bom.scrapItems ? bom.scrapItems.length : 0;

        res.status(200).json({
            ...bom.toJSON(),
            rawMaterials, //  Return only parent raw materials with nested children
            scrapCount
        });

    } catch (error) {
        console.error("Error fetching BOM:", error);
        res.status(500).json({ message: "Server error" });
    }
};




exports.getBOMByProductCode = async (req, res) => {
    try {
        const { product_code } = req.params;

        const bomRecords = await BOM.findAll({
            include: [
                { model: FinishedGoods, as: "finishedGoods" },
                {
                    model: RawMaterial,
                    as: "rawMaterials",
                    include: [
                      {
                        model: RawMaterialAlternative,
                        as: "alternatives",
                      }
                    ]
                  }
            ],
            where: { '$finishedGoods.product_code$': product_code }
        });

        if (!bomRecords.length) {
            return res.status(200).json([]);
        }

        res.status(200).json({ success: true, data: bomRecords });
    } catch (error) {
        console.error("Error fetching BOMs:", error);
        res.status(500).json({ message: "Server error", error });
    }
};



exports.getBOMDetailsByProductId = async (req, res) => {
    try {
      const { product_code } = req.params;  
      const bomRecords = await BOM.findAll({
        include: [
          {
            model: FinishedGoods,
            as: "finishedGoods",
            required: true,
            where: { product_code },
          },
          {
            model: FinishedGoodsAlternate,
            as: "finishedGoodsAlternate",
          },
          {
            model: RawMaterial,
            as: "rawMaterials",
            include: [
              {
                model: RawMaterialAlternative,
                as: "alternatives",
              }
            ]
          },
          {
            model: ScrapItem,
            as: "scrapItems",
          },
          {
            model: Routing,
            as: "routing",
          }
        ]
      });
  
      if (!bomRecords.length) {
        return res.status(404).json({ message: "No BOM found for the given product_id" });
      }
  
      res.status(200).json({ success: true, data: bomRecords });
    } catch (error) {
      console.error("Error fetching BOM details:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
 
exports.CreateProductionRoute = async (req, res) => {
    try {
        const GetProductionRoute = await ProductionRoute.findAll({ where: { company_id: req.user.company_id, is_delete: 1 } })
        await ProductionRoute.create({
            bom_id: req.body.bom_id,
            route_id: req.body.route_id,
            user_id: req.user.id,
            company_id: req.user.company_id,
            route_name: req.body.name,
            description: req.body.description,
        })
        return res.status(200).json({ success: true, message: "Production Route has been created" })
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }
}

exports.GetProductionRoute = async (req, res) => {
    try {
        const GetProductionRoute = await ProductionRoute.findAll({ where: { company_id: req.user.company_id, is_delete: 1 } })
        return res.status(200).json({ success: true, data: GetProductionRoute })
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }
}

exports.UpdateProductionRoute = async (req, res) => {
    try {
        await ProductionRoute.update({
            route_id: req.body.route_id,
            route_name: req.body.route_name,
            description: req.body.description,
        }, { where: { id: req.params.id } })
        return res.status(200).json({ success: true, message: "Production Route has been updated" })
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }
}

exports.DeleteProductionRoute = async (req, res) => {
    try {
        await ProductionRoute.update({
            is_delete: 0
        }, { where: { id: req.params.id } })
        return res.status(200).json({ success: true, message: "Production Route has been deleted" })
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }
}

exports.UpdateSequence = async (req, res) => {
    try {
        const GetProductionRoute = await ProductionRoute.findAll({ where: { company_id: req.user.company_id, is_delete: 1 } })

        const data = req.body.item != "" ? JSON.parse(req.body.item) : [];

        const updateId = [];
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            await ProductionRoute.update({
                sequence: i + 1,
            }, { where: { id: element.id } })
            updateId.push(element.id)
        }

        for (let j = 0; j < GetProductionRoute.length; j++) {
            const ele = GetProductionRoute[j];
            if (!updateId.includes(ele.id)) {
                await ProductionRoute.update({
                    sequence: 0,
                }, { where: { id: ele.id } })
            }
        }

        return res.status(200).json({ success: true, message: "Production sequence has been updated" })
    } catch (err) {
        return res.status(400).json({ success: false, message: err })
    }
}

exports.GetSequenceData = async (req, res) => {
    try {
        const GetProductionRoute = await ProductionRoute.findAll({
            where: {
                company_id: req.user.company_id,
                is_delete: 1,
                sequence: { [Op.not]: 0 }
            }, order: [
                ['sequence', 'ASC'],
            ]
        })
        return res.status(200).json({ success: true, data: GetProductionRoute })
    } catch (err) {
        return res.status(200).json({ success: false, message: err })
    }
}

exports.FinishedGoodsData = async (req, res) => {
    try {
        const { product_code, product_name } = req.query;

        // Ensure that either product_code or product_name is provided
        if (!product_code && !product_name) {
            return res.status(400).json({ message: 'Product Code or Name is required.' });
        }

        // Create where clause dynamically
        const whereClause = product_code ? { product_code } : { product_name };
        const item = await Product.findOne({ where: whereClause, 
            include: [
                {
                  model: ProductCategories,
                  as: "Categories",
                  attributes: ["title"],
                },
                {
                  model: MasteruomModel,
                  as: "Masteruom",
                  attributes: ["unit_name"],
                }
              ],
        });

        // Check if the item exists
        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        // Send the response once, no extra response at the end
        return res.status(200).json({ success: true, data: item });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};

exports.getBOMList = async (req, res) => { 
    try {
        const company_id = req.user.company_id;  // Get the company ID from the logged-in user

        const bomList = await BOM.findAll({
            where: { company_id, is_deleted: false },
            include: [
                { model: FinishedGoods, as: "finishedGoods", attributes: ["name"] },
                { model: RawMaterial, as: "rawMaterials", attributes: ["id"] }, // Include raw materials
                { model: User, as: "UserDetailsM", attributes: ["name"] }
            ],
            order: [["updated_at", "DESC"]]
        });

        // Format the data before sending
        const formattedBOMs = bomList.map((bom) => ({
            bomId: bom.id, //  Now using the actual BOM ID instead of bom.bomNumber
            bomNumber: bom.bomNumber, // Keeping BOM number as a separate field
            bomName: bom.documentName || "N/A",
            status: "published", // Modify status logic if needed
            fgName: bom.finishedGoods?.[0]?.name || "Unknown FG",
            numberOfRm: bom.rawMaterials ? bom.rawMaterials.length : 0, // Corrected raw material count
            lastModifiedBy: bom.UserDetailsM?.name || "Unknown",
            lastModifiedDate: new Date(bom.updated_at).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            }),
        }));

        res.status(200).json(formattedBOMs);
    } catch (error) {
        console.error("Error fetching BOM list:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.softDeleteBOMs = async (req, res) => {
    try {
        const { bomIds } = req.body;

        if (!bomIds || bomIds.length === 0) {
            return res.status(400).json({ message: "No BOMs selected for deletion." });
        }

        await BOM.update(
            { is_deleted: true },
            { where: { id: bomIds } }
        );

        res.status(200).json({ message: "BOMs soft deleted successfully!" });
    } catch (error) {
        console.error("Error soft deleting BOMs:", error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.softDeleteWorkOrders = async (req, res) => { 
    try {
        const { ids } = req.body; // Array of selected IDs
        // console.log(ids, "Deleting these IDs");

        if (!ids || ids.length === 0) {
            return res.status(400).json({ error: "No items selected for deletion" });
        }

        const result = await PurchaseProduct.update(
            { is_deleted: 1 },
            { where: { id: { [Op.in]: ids } } }
        );

        if (result[0] === 0) {
            return res.status(404).json({ error: "No matching records found" });
        }

        res.json({ success: true, message: "Work orders soft deleted successfully" });
    } catch (error) {
        console.error("Error deleting work orders:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};


// start production select

// exports.GetSelectedProductsForProcessing = async (req, res) => {
//     try {
//         if (!req.user?.company_id) {
//             return res.status(400).json({ error: "Company ID is required" });
//         }

//         const { ids } = req.body;
//         if (!ids || ids.length === 0) {
//             return res.status(400).json({ error: "No product IDs provided" });
//         }

//         console.log("Selected Product IDs:", ids);

//         // Fetch All Stores for the Same Company
//         const allStores = await Warehouse.findAll({
//             where: { company_id: req.user.company_id }, 
//             attributes: ["id", "name", "store_type"]
//         });

//         console.log("All Stores Fetched:", JSON.stringify(allStores, null, 2));
//         const inStockStores = allStores.filter(store => store.store_type === "In-Stock Stores");
//         const rejectedGoodsStores = allStores.filter(store => store.store_type === "Rejected Goods Stores");
       
//         const workOrders = await PurchaseProduct.findAll({
//             where: { 
//                 company_id: req.user.company_id, 
//                 is_deleted: { [Op.ne]: 1 },
//                 id: { [Op.in]: ids } 
//             },
//             include: [
//                 {
//                     model: Purchase,
//                     as: "purchase",
//                     required: true,
//                     where: { status: 4, mailsend_status: 1 },
//                     attributes: ["id", "reference_number", "customer_id", "total_amount", "expiration", "created_at"],
//                     include: [
//                         { model: Customer, as: "customer", attributes: ["id", "name"] },
//                         { model: User, as: "createdByUser", attributes: ["id", "name"] },
//                     ],
//                 },
//                 {
//                     model: Product,
//                     as: "ProductsItem",
//                     attributes: ["id", "product_name", "product_code", "unit"],
//                     include: [
//                         {
//                             model: MasteruomModel,
//                             as: "Masteruom",
//                             attributes: ["unit_name"]
//                         },
//                         {
//                             model: TrackProductStock,
//                             as: "TrackProductStock",
//                             attributes: ["quantity_changed", "status_in_out", "store_id"]
//                         }
//                     ]
//                 }
//             ],
//             order: [["created_at", "DESC"]],
//         });

//         console.log("Work Orders Fetched:", JSON.stringify(workOrders, null, 2));

//         //  Get Product IDs
//         const productIds = workOrders
//             .map(order => order.ProductsItem?.id)
//             .filter(id => id); // Remove nulls

//         if (productIds.length === 0) {
//             console.warn(" No valid product IDs found.");
//             return res.status(200).json({ workOrders, inStockStores, rejectedGoodsStores }); //  Return stores even if no products
//         }

//         //  Fetch Finished Goods and BOM data manually
//         const finishedGoodsData = await FinishedGoods.findAll({
//             where: { product_id: { [Op.in]: productIds } },
//             attributes: ["product_id", "bomId"]
//         });

//         const bomIds = finishedGoodsData.map(fg => fg.bomId).filter(id => id); // Remove nulls
//         const bomData = await BOM.findAll({
//             where: { id: { [Op.in]: bomIds } },
//             attributes: ["id", "bomNumber"]
//         });

//         console.log("BOM Data Fetched:", JSON.stringify(bomData, null, 2));

//         //  Create maps for quick lookup
//         const finishedGoodsMap = {};
//         finishedGoodsData.forEach(item => {
//             finishedGoodsMap[item.product_id] = item.bomId;
//         });

//         const bomMap = {};
//         bomData.forEach(item => {
//             bomMap[item.id] = item.bomNumber;
//         });

//         //  Attach `finalStock` and `bomNumber` to each work order
//         const enrichedWorkOrders = workOrders.map(order => {
//             const productId = order.ProductsItem?.id;
//             const stockMovements = order.ProductsItem?.TrackProductStock || [];

//             const stockIn = stockMovements
//                 .filter(item => item.status_in_out === 1)
//                 .reduce((total, item) => total + item.quantity_changed, 0);

//             const stockOut = stockMovements
//                 .filter(item => item.status_in_out === 0)
//                 .reduce((total, item) => total + item.quantity_changed, 0);

//             const bomId = finishedGoodsMap[productId] || null;
//             const bomNumber = bomId ? bomMap[bomId] : "N/A";

//             return {
//                 ...order.toJSON(),
//                 finalStock: stockIn - stockOut,
//                 bomNumber 
//             };
//         });

//         console.log("Final Enriched Data:", JSON.stringify(enrichedWorkOrders, null, 2));

//         res.status(200).json({ workOrders: enrichedWorkOrders, inStockStores, rejectedGoodsStores });
       
//     } catch (error) {
//         console.error(" Error fetching selected products:", error);
//         res.status(500).json({ error: error.message || "Internal Server Error" });
//     }
// };
exports.getProduction = async (req, res) => {
    try {
        const production = await Production.findAll();
        res.json(production);
    }catch (error) {
        console.error(" Error fetching selected products:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}

exports.GetSelectedProductsForProcessing = async (req, res) => {
   
    
    try {
        if (!req.user?.company_id) {
            return res.status(400).json({ error: "Company ID is required" });
        }

        const { ids } = req.body;
        if (!ids || ids.length === 0) {
            return res.status(400).json({ error: "No product IDs provided" });
        }

        // Fetch All Stores for the Same Company
        const allStores = await Warehouse.findAll({
            where: { company_id: req.user.company_id }, 
            attributes: ["id", "name", "store_type"]
        });

        const inStockStores = allStores.filter(store => store.store_type === "In-Stock Stores");
        const rejectedGoodsStores = allStores.filter(store => store.store_type === "Rejected Goods Stores");

        const workOrders = await PurchaseProduct.findAll({
            where: { 
                company_id: req.user.company_id, 
                is_deleted: { [Op.ne]: 1 },
                id: { [Op.in]: ids } 
            },
            include: [
                {
                    model: Purchase,
                    as: "purchase",
                    required: true,
                    where: { status: 11, mailsend_status: 1 },
                    attributes: ["id", "reference_number", "customer_id", "total_amount", "expiration", "created_at"],
                    include: [
                        { model: Customer, as: "customer", attributes: ["id", "name"] },
                        { model: User, as: "createdByUser", attributes: ["id", "name"] },
                    ],
                },
                {
                    model: Product,
                    as: "ProductsItem",
                    attributes: ["id", "product_name", "product_code", "unit"],
                    include: [
                        {
                            model: MasteruomModel,
                            as: "Masteruom",
                            attributes: ["unit_name"]
                        },
                        {
                            model: TrackProductStock,
                            as: "TrackProductStock",
                            attributes: ["quantity_changed", "status_in_out", "store_id"]
                        }
                    ]
                }
            ],
            order: [["created_at", "DESC"]],
        });

        const productIds = workOrders.map(order => order.ProductsItem?.id).filter(id => id);
        if (productIds.length === 0) {
            return res.status(200).json({ workOrders, inStockStores, rejectedGoodsStores });
        }

        // Fetch Finished Goods and BOM data
        const finishedGoodsData = await FinishedGoods.findAll({
            where: { product_id: { [Op.in]: productIds } },
            attributes: ["product_id", "bomId"]
        });

        const bomIds = finishedGoodsData.map(fg => fg.bomId).filter(id => id);
        const bomData = await BOM.findAll({
            where: { id: { [Op.in]: bomIds } },
            attributes: ["id", "bomNumber"]
        });

        // console.log("BOM Data Fetched:", JSON.stringify(bomData, null, 2));

        // Create maps for lookup
        const finishedGoodsMap = {};
        finishedGoodsData.forEach(item => {
            if (!finishedGoodsMap[item.product_id]) {
                finishedGoodsMap[item.product_id] = [];
            }
            finishedGoodsMap[item.product_id].push(item.bomId);
        });

        const bomMap = {};
        bomData.forEach(item => {
            if (!bomMap[item.id]) {
                bomMap[item.id] = [];
            }
            bomMap[item.id].push(item.bomNumber);
        });

       
        const enrichedWorkOrders = workOrders.map(order => {
            const productId = order.ProductsItem?.id;
            const stockMovements = order.ProductsItem?.TrackProductStock || [];

            const stockIn = stockMovements
                .filter(item => item.status_in_out === 1)
                .reduce((total, item) => total + item.quantity_changed, 0);

            const stockOut = stockMovements
                .filter(item => item.status_in_out === 0)
                .reduce((total, item) => total + item.quantity_changed, 0);

            const bomIds = finishedGoodsMap[productId] || [];
            const bomNumbers = bomIds.flatMap(id => bomMap[id] || []);

            return {
                ...order.toJSON(),
                finalStock: stockIn - stockOut,
                bomNumbers 
            };
        });

        // console.log("Final Enriched Data:", JSON.stringify(enrichedWorkOrders, null, 2));

        res.status(200).json({ workOrders: enrichedWorkOrders, inStockStores, rejectedGoodsStores });
       
    } catch (error) {
        console.error(" Error fetching selected products:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};


// PRODUCTION AFRER SUBMIT

const generateProductionNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PROD${timestamp}${randomNum}`; 
};
exports.getProductionDetailsAfterSubmit = async (req, res) => {
    try {
        const referenceNumber = await generateUniqueReferenceNumber();
        const { stage, products } = req.body;

        if (!products || products.length === 0) {
            return res.status(400).json({ error: "No products provided for production." });
        }

        // console.log("Starting Production Insertion for Products:", JSON.stringify(products, null, 2));

        let insertedProductions = [];

        for (const product of products) {
            const productionNumber = generateProductionNumber();
            
            // Fetch BOM Details
            const bomRecord = await BOM.findOne({
                where: { bomNumber: product.bomNumber },
                include: [
                    { model: FinishedGoods, as: "finishedGoods" },
                    { 
                        model: RawMaterial, 
                        as: "rawMaterials", 
                        include: [
                            { model: RawMaterial, as: "childMaterials" }, 
                            { model: AlternativeMaterial, as: "alternatives" }  // Ensure alternatives are included
                        ] 
                    },
                    { model: Routing, as: "routing" },
                    { model: ScrapItem, as: "scrapItems" }
                ]
            });

            if (!bomRecord) {
                console.warn(`No BOM found for BOM Number: ${product.bomNumber}`);
                continue;
            }

            // Calculate Total Charges
            const labourTotal = product.qty * (bomRecord.labour_charges_amount || 0);
            const machineryTotal = product.qty * (bomRecord.machinery_charges_amount || 0);
            const electricityTotal = product.qty * (bomRecord.electricity_charges_amount || 0);
            const otherTotal = product.qty * (bomRecord.other_charges_amount || 0);
            const totalCharges = labourTotal + machineryTotal + electricityTotal + otherTotal;

            //  Insert Production Record
            const newProduction = await Production.create({
                production_number: productionNumber,
                product_id: product.productid,
                sales_id: product.salesid,
                stage: stage,
                quantity: product.qty,
                fg_store: product.fgStore,
                rm_store: product.rmStore,
                scrap_store: product.scrapStore,
                bom_number: product.bomNumber,
                labour_charges: labourTotal,
                machinery_charges: machineryTotal,
                electricity_charges: electricityTotal,
                other_charges: otherTotal,
                labourChargesAA: stage === "MarkComplete" ? labourTotal : 0,
                machineryChargesAA: stage === "MarkComplete" ? machineryTotal : 0,
                electricityChargesAA: stage === "MarkComplete" ? electricityTotal : 0,
                otherChargesAA: stage === "MarkComplete" ? otherTotal : 0,
                total_charges: totalCharges,
                status: stage === "MarkComplete" ? "5" :
                        stage === "CreateProcess" ? "1" :
                        stage === "BulkIssue_ApproveInventory" ? "2" : "inprogress",
                company_id: req.user.company_id,
                user_id: req.user.id,
            });

            const productionId = newProduction.id;
             // Update PurchaseProduct table if status is "MarkComplete"
             if (stage === "MarkComplete") {
                await PurchaseProduct.update(
                    { production_status: 5, production_number: productionNumber }, 
                    { where: { id: product.id } }
                );
            } else if (stage === "CreateProcess") {
                await PurchaseProduct.update(
                    { production_status: 1, production_number: productionNumber }, 
                    { where: { id: product.id } }
                );
            } else if (stage === "BulkIssue_ApproveInventory") {
                await PurchaseProduct.update(
                    { production_status: 2, production_number: productionNumber }, 
                    { where: { id: product.id } }
                );
            }

            // Step 4: Insert Production Raw Materials (Parent, Child, Alternative)
            for (const rawMaterial of bomRecord.rawMaterials) {
                const parentProduct = await Product.findOne({ where: { id: rawMaterial.product_id }, attributes: ["unit","product_price","product_name",] });
                const parentUnit = parentProduct 
                    ? await MasteruomModel.findOne({ where: { id: parentProduct.unit }, attributes: ["unit_name"] }) 
                    : null;

                // Insert Parent Raw Material (Avoid Duplicates)
                const parentRawMaterial = await ProductionRawMaterial.findOrCreate({
                    where: {
                        production_id: productionId,
                        product_id: rawMaterial.product_id,
                        quantity: product.qty * rawMaterial.quantity
                    },
                    defaults: {
                        unit: parentUnit ? parentUnit.unit_name : "N/A",
                        usedRM: stage === "MarkComplete" ? product.qty * rawMaterial.quantity : 0,
                        EstimatedProduction: product.qty * rawMaterial.quantity ,
                        produced: stage === "MarkComplete" ? product.qty * rawMaterial.quantity : 0,
                        child_flag: false, 
                        store_id: product.rmStore,
                        alternative_flag: false, 
                        parent_raw_material_id: null
                    }
                });

                const parentRawMaterialId = parentRawMaterial[0].id;

                // Insert Child Raw Materials (Fix for duplicates)
                for (const child of rawMaterial.childMaterials) {
                    const childProduct = await Product.findOne({ where: { id: child.product_id }, attributes: ["unit"] });
                    const childUnit = childProduct 
                        ? await MasteruomModel.findOne({ where: { id: childProduct.unit }, attributes: ["unit_name"] }) 
                        : null;

                    await ProductionRawMaterial.create({
                        production_id: productionId,
                        product_id: child.product_id,
                        quantity: product.qty * child.quantity,
                        usedRM: stage === "MarkComplete" ? product.qty * child.quantity : 0,
                        EstimatedProduction:  product.qty * child.quantity ,
                        produced: stage === "MarkComplete" ? product.qty * child.quantity : 0,
                        unit: childUnit ? childUnit.unit_name : "N/A",
                        child_flag: true, 
                        alternative_flag: false,
                        store_id: product.rmStore,
                        parent_raw_material_id: parentRawMaterialId
                    });
                }

                // Insert Alternative Raw Materials
                for (const alternative of rawMaterial.alternatives) {
                    const altProduct = await Product.findOne({ where: { id: alternative.product_id }, attributes: ["unit"] });
                    const altUnit = altProduct 
                        ? await MasteruomModel.findOne({ where: { id: altProduct.unit }, attributes: ["unit_name"] }) 
                        : null;

                    await ProductionRawMaterial.create({
                        production_id: productionId,
                        product_id: alternative.product_id,
                        quantity: product.qty * alternative.quantity,
                        usedRM: stage === "MarkComplete" ? product.qty * alternative.quantity : 0,
                        EstimatedProduction:product.qty * alternative.quantity,
                        produced: stage === "MarkComplete" ? product.qty * alternative.quantity : 0,
                        unit: altUnit ? altUnit.unit_name : "N/A",
                        child_flag: false,
                        store_id: product.rmStore,
                        alternative_flag: true,
                        parent_raw_material_id: parentRawMaterialId
                    });
                }
           

                const stockData = await TrackProductStock.findAll({
                    where: {
                      product_id: rawMaterial.product_id,
                      store_id: product.rmStore,
                    }
                  });
                  
                  let stockIn = 0, stockOut = 0;
                  stockData.forEach((entry) => {
                    if (entry.status_in_out === 1) stockIn += entry.quantity_changed;
                    if (entry.status_in_out === 0) stockOut += entry.quantity_changed;
                  });
                  
                  const currentStock = stockIn - stockOut;
                  const usedQty = product.qty * rawMaterial.quantity;
                  const finalQuantity = currentStock - usedQty;
                // Track stock for raw materials used
                if (stage === "MarkComplete") {
                    await TrackProductStock.create({
                        product_id: rawMaterial.product_id,
                        item_name: parentProduct.product_name || "",
                        store_id: product.rmStore,
                        reference_number: "INV" + referenceNumber,
                        barcode_number: generateRandomBarcode(),
                        quantity_changed: usedQty,
                        final_quantity: finalQuantity,
                        default_price: parentProduct.product_price || 0,
                        comment: "Issued for production",
                        item_unit: parentProduct.item_unit || "",
                        adjustmentType: "Production Raw Material Used",
                        status_in_out: 0,
                        user_id: req.user.id,
                        company_id: req.user.company_id,
                    });
                }
                  
                
            }
            //  Insert Production Finished Goods
            for (const fg of bomRecord.finishedGoods) {
                await ProductionFinishedGoods.create({
                    production_id: productionId,
                    product_id: fg.product_id,
                    quantity: product.qty * fg.quantity,
                    unit: fg.unit,
                    costAllocation: fg.costAllocation,
                    targetProduction: product.qty * fg.quantity,
                    completed: stage === "MarkComplete" ? product.qty * fg.quantity : 0,
                    tested: stage === "MarkComplete" ? product.qty * fg.quantity : 0,
                    passed: stage === "MarkComplete" ? product.qty * fg.quantity : 0,
                    rejected: 0,
                    forRepair: 0,
                    repaired: 0,
                    comment: fg.comment
                });

                const productDetails = await Product.findOne({
                    where: { id:  fg.product_id }
                });
            // Fetch stock data for the product and store
            const stockData = await TrackProductStock.findAll({
                where: {
                    product_id: fg.product_id,
                    store_id: product.fgStore, 
                }
            });
        
            let stockIn = 0;
            let stockOut = 0;
        
            // Calculate stockIn and stockOut based on status_in_out
            stockData.forEach((entry) => {
                if (entry.status_in_out === 1) {
                    stockIn += entry.quantity_changed;
                } else if (entry.status_in_out === 0) {
                    stockOut += entry.quantity_changed;
                }
            });
        
            // Calculate current stock
            const currentStock = stockIn - stockOut;
            const chaqty = 0;
            // Create a new stock entry for finished goods added
            if (stage === "MarkComplete") {
                await TrackProductStock.create({
                    product_id: fg.product_id,
                    item_name: productDetails.product_name || '',
                    store_id: product.fgStore,
                    reference_number: "INV" + referenceNumber,
                    barcode_number: generateRandomBarcode(),
                    quantity_changed: product.qty * fg.quantity,
                    final_quantity: currentStock + chaqty,
                    default_price: productDetails.product_price || 0,
                    comment: "Finished goods added to bulk stock",
                    item_unit: product.unit || "",
                    adjustmentType: "Production FG In",
                    status_in_out: 1,
                    user_id: req.user.id,
                    company_id: req.user.company_id,
                });
            }
            }

            // Insert Production Scrap Items
            for (const scrap of bomRecord.scrapItems) {
                await ProductionScrapItems.create({
                    production_id: productionId,
                    product_id: scrap.product_id,
                    scrap_qty: product.qty * scrap.quantity,
                    scrap_unit: scrap.unit,
                    estimatedquantity:  product.qty * scrap.quantity ,
                    actualquantity: stage === "MarkComplete" ? product.qty * scrap.quantity : 0,
                    costAllocation: scrap.costAllocation,
                    comment: scrap.comment
                });
            }

            if (bomRecord.routing?.length) {
                for (const route of bomRecord.routing) {
                    await ProductionRouteProcess.create({
                        production_id: productionId,
                        bom_id: bomRecord.id,
                        route_id: route.route_id,
                        route_name: route.route_name,
                        sequence: route.sequence,
                        description: route.comment || "-",
                        
                        company_id: req.user.company_id,
                        user_id: req.user.id,
                    });
                }
            }

            insertedProductions.push({
                production: newProduction,
                bomDetails: bomRecord
            });
        }

        res.status(200).json({ success: true, insertedProductions });
    } catch (error) {
        console.error("Error inserting production details:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};



exports.submitBulkProductionupdate = async (req, res) => {
    try {
        const userId = req.user.id;
      const companyId = req.user.company_id;
      const referenceNumber = await generateUniqueReferenceNumber();
        const { action, production, rawMaterials, finishedGoods, scrapItems, routingProcesses } = req.body;

        if (!production) {
            return res.status(400).json({ error: "No production data available!" });
        }

        if (action === "bulk_update") {
            //  Update Production Record
            const existingProduction = await Production.findOne({
                where: { id: production.id }
            });

            if (!existingProduction) {
                return res.status(404).json({ error: "Production record not found!" });
            }
            
            await existingProduction.update({
                labourChargesAA: production.labour_charges,
                machineryChargesAA: production.machinery_charges,
                electricityChargesAA: production.fg_store,
                otherChargesAA: production.electricity_charges,
                status: 2,
                is_action:'bulk_update'
            });

            // Update Raw Materials
            for (const rm of rawMaterials) {
                await ProductionRawMaterial.update(
                    { 
                        usedRM: rm.quantity,
                        EstimatedProduction: 0,
                        produced: 0,
                    },
                    { where: { id: rm.id } }
                );
            }
            //  Update Finished Goods
            for (const fg of finishedGoods) {
                await ProductionFinishedGoods.update(
                    { 
                        targetProduction: fg.quantity,
                        completed: fg.quantity,
                        tested: fg.quantity,
                        passed: fg.quantity,
                        rejected: 0,
                        forRepair: 0,
                        repaired: 0,
                    },
                    { where: { id: fg.id } }
                );
            }

            // //  Update Scrap Items
            for (const scrap of scrapItems) {
                await ProductionScrapItems.update(
                    { scrap_qty: scrap.scrap_qty,
                      actualquantity: scrap.scrap_qty,
                      estimatedquantity: scrap.scrap_qty,
                     },
                    { where: { id: scrap.id } }
                );
            }

            return res.status(200).json({ success: true, message: "Bulk update completed successfully!" });
        }

        if (action === "complete") {
            // Fetch the production record
            const existingProduction = await Production.findOne({
                where: { id: production.id }
            });
        
            if (!existingProduction) {
                return res.status(404).json({ error: "Production record not found!" });
            }
        
            // Update production status
            await existingProduction.update({
                status: 5, // Assuming 5 means "completed"
            });
        
            // Update the PurchaseProduct status
            await PurchaseProduct.update(
                { production_status: 5 }, 
                { where: { production_number: production.production_number } }
            );
        
            // Fetch product details
            const product = await Product.findOne({
                where: { id: existingProduction.product_id }
            });
        
            // Fetch finished goods process details
            const fgprocess = await ProductionFinishedGoods.findOne({
                where: { production_id: production.id }
            });
            const chaqty = fgprocess.targetProduction;
        
            // Fetch stock data for the product and store
            const stockData = await TrackProductStock.findAll({
                where: {
                    product_id: existingProduction.product_id,
                    store_id: existingProduction.fg_store, 
                }
            });
        
            let stockIn = 0;
            let stockOut = 0;
        
            // Calculate stockIn and stockOut based on status_in_out
            stockData.forEach((entry) => {
                if (entry.status_in_out === 1) {
                    stockIn += entry.quantity_changed;
                } else if (entry.status_in_out === 0) {
                    stockOut += entry.quantity_changed;
                }
            });
        
            // Calculate current stock
            const currentStock = stockIn - stockOut;
        
            // Create a new stock entry for finished goods added
            await TrackProductStock.create({
                product_id: existingProduction.product_id,
                item_name: product.product_name || '',
                store_id: existingProduction.fg_store, // Store ID from production
                reference_number: "INV" + referenceNumber, // Use production number for reference
                barcode_number: generateRandomBarcode(),
                quantity_changed: chaqty,
                final_quantity: currentStock + chaqty, // Adding finished goods to current stock
                default_price: product.product_price || 0,
                comment: "Finished goods added to stock",
                item_unit: product.unit || "",
                adjustmentType: "Production FG In", // Stock-in for finished goods
                status_in_out: 1, // 1 means stock-in
                user_id: userId,
                company_id: companyId,
            });
        
            return res.status(200).json({ success: true, message: "Bulk update completed successfully!" });
        }
        
        return res.status(400).json({ error: "Invalid action!" });

    } catch (error) {
        console.error("Error processing production data:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

exports.getProductionDetails = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Production ID is required." });
        }

        //   Fetch Production Details
        const production = await Production.findOne({ where: { id } });

        if (!production) {
            return res.status(404).json({ error: "Production not found." });
        }

        //  Fetch BOM Details
        const bomDetails = await BOM.findOne({ where: { bomNumber: production.bom_number } });

        if (!bomDetails) {
            console.warn(` BOM not found for BOM Number: ${production.bom_number}`);
        }

        //  Fetch User Details
        const userDetails = await User.findOne({
            where: { id: production.user_id },
            attributes: ["id", "name", "email"]
        });

        //  Fetch Product Details with Category Name
        const productDetails = await Product.findOne({
            where: { id: production.product_id },
            attributes: ["id", "product_name", "product_code", "product_category","product_price"],
            include: [
                {
                    model: ProductCategories,
                    as: "Categories",
                    attributes: ["title"],
                    required: false
                }
            ]
        });

        const categoryName = productDetails?.Categories?.title || "N/A";

        // Fetch Warehouse Store Names
        const storeQuery = `
            SELECT 
                fg.id AS fg_store_id, fg.name AS fg_store_name,
                rm.id AS rm_store_id, rm.name AS rm_store_name,
                scrap.id AS scrap_store_id, scrap.name AS scrap_store_name
            FROM warehouse_settings fg
            LEFT JOIN warehouse_settings rm ON rm.id = :rm_store
            LEFT JOIN warehouse_settings scrap ON scrap.id = :scrap_store
            WHERE fg.id = :fg_store
        `;

        const [storeDetails] = await Production.sequelize.query(storeQuery, {
            replacements: { 
                fg_store: production.fg_store, 
                rm_store: production.rm_store, 
                scrap_store: production.scrap_store 
            },
            type: Production.sequelize.QueryTypes.SELECT
        });

        // Fetch Finished Goods with Product Name
        const finishedGoodsQuery = `
            SELECT fg.*, p.product_name, p.product_code, p.product_price
            FROM production_finished_goods fg
            LEFT JOIN product p ON fg.product_id = p.id
            WHERE fg.production_id = :id
        `;

        const finishedGoods = await Production.sequelize.query(finishedGoodsQuery, {
            replacements: { id },
            type: Production.sequelize.QueryTypes.SELECT
        });

        //  Step 7: Fetch Raw Materials with Parent-Child Hierarchy, Stock, and Category Name
        // const rawMaterialsQuery = `
        //     WITH RECURSIVE RawMaterialHierarchy AS (
        //         SELECT rm.*, p.product_name, p.product_code, c.title AS category_name,
        //             COALESCE(
        //                 (SELECT SUM(ts.quantity_changed) FROM track_product_stock ts 
        //                  WHERE ts.product_id = rm.product_id AND ts.status_in_out = 1), 0
        //             ) AS stockIn,
        //             COALESCE(
        //                 (SELECT SUM(ts.quantity_changed) FROM track_product_stock ts 
        //                  WHERE ts.product_id = rm.product_id AND ts.status_in_out = 0), 0
        //             ) AS stockOut
        //         FROM production_raw_material rm
        //         LEFT JOIN product p ON rm.product_id = p.id
        //         LEFT JOIN categories c ON p.product_category = c.id
        //         WHERE rm.production_id = :id AND rm.parent_raw_material_id IS NULL
                
        //         UNION ALL

        //         SELECT child_rm.*, p.product_name, p.product_code, c.title AS category_name,
        //             COALESCE(
        //                 (SELECT SUM(ts.quantity_changed) FROM track_product_stock ts 
        //                  WHERE ts.product_id = child_rm.product_id AND ts.status_in_out = 1), 0
        //             ) AS stockIn,
        //             COALESCE(
        //                 (SELECT SUM(ts.quantity_changed) FROM track_product_stock ts 
        //                  WHERE ts.product_id = child_rm.product_id AND ts.status_in_out = 0), 0
        //             ) AS stockOut
        //         FROM production_raw_material child_rm
        //         INNER JOIN RawMaterialHierarchy parent ON child_rm.parent_raw_material_id = parent.id
        //         LEFT JOIN product p ON child_rm.product_id = p.id
        //         LEFT JOIN categories c ON p.product_category = c.id
        //     )
        //     SELECT *, (stockIn - stockOut) AS currentStock, 
        //            COALESCE(category_name, 'N/A') AS categoryName
        //     FROM RawMaterialHierarchy 
        //     ORDER BY parent_raw_material_id, id
        // `;

        const rawMaterialsQuery = `
    WITH RECURSIVE RawMaterialHierarchy AS (
        SELECT rm.*, p.product_name, p.product_code, p.product_price, c.title AS category_name,
            COALESCE(
                (SELECT SUM(ts.quantity_changed) FROM track_product_stock ts 
                 WHERE ts.product_id = rm.product_id AND ts.status_in_out = 1), 0
            ) AS stockIn,
            COALESCE(
                (SELECT SUM(ts.quantity_changed) FROM track_product_stock ts 
                 WHERE ts.product_id = rm.product_id AND ts.status_in_out = 0), 0
            ) AS stockOut
        FROM production_raw_material rm
        LEFT JOIN product p ON rm.product_id = p.id
        LEFT JOIN categories c ON p.product_category = c.id
        WHERE rm.production_id = :id AND rm.parent_raw_material_id IS NULL
        
        UNION ALL

        SELECT child_rm.*, p.product_name, p.product_code, p.product_price, c.title AS category_name,
            COALESCE(
                (SELECT SUM(ts.quantity_changed) FROM track_product_stock ts 
                 WHERE ts.product_id = child_rm.product_id AND ts.status_in_out = 1), 0
            ) AS stockIn,
            COALESCE(
                (SELECT SUM(ts.quantity_changed) FROM track_product_stock ts 
                 WHERE ts.product_id = child_rm.product_id AND ts.status_in_out = 0), 0
            ) AS stockOut
        FROM production_raw_material child_rm
        INNER JOIN RawMaterialHierarchy parent ON child_rm.parent_raw_material_id = parent.id
        LEFT JOIN product p ON child_rm.product_id = p.id
        LEFT JOIN categories c ON p.product_category = c.id
    )
    SELECT *, (stockIn - stockOut) AS currentStock, 
           COALESCE(category_name, 'N/A') AS categoryName
    FROM RawMaterialHierarchy 
    ORDER BY parent_raw_material_id, id
`;

        const rawMaterials = await Production.sequelize.query(rawMaterialsQuery, {
            replacements: { id },
            type: Production.sequelize.QueryTypes.SELECT
        });

        //  Fetch Routing Process
        const routing = await ProductionRouteProcess.findAll({ where: { production_id: id } });

        // Fetch Scrap Items with Product Name
        
const scrapItemsQuery = `
            SELECT s.*, p.product_name, p.product_code, c.title AS category_name
            FROM production_scrap_items s
            LEFT JOIN product p ON s.product_id = p.id
            LEFT JOIN categories c ON p.product_category = c.id -- ✅ Get category name
            WHERE s.production_id = :id
        `;

        const scrapItems = await Production.sequelize.query(scrapItemsQuery, {
            replacements: { id },
            type: Production.sequelize.QueryTypes.SELECT
        });

        //  Return Data in JSON Response
        res.status(200).json({
            production,
            productDetails: {
                ...productDetails?.toJSON(),
                categoryName
            },
            userDetails,
            bomDetails,
            storeDetails,
            finishedGoods,
            rawMaterials,
            routing,
            scrapItems
        });

    } catch (error) {
        console.error(" Error fetching production details:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};


exports.getCurrentStock = async (req, res) => {
    try {
      const { product_id, store_id } = req.query;
 
      const stockData = await TrackProductStock.findAll({
        where: {
          product_id,
          store_id,
        },
      });
  
      let stockIn = 0;
      let stockOut = 0;
  
      stockData.forEach((entry) => {
        if (entry.status_in_out === 1) {
          stockIn += entry.quantity_changed;
        } else if (entry.status_in_out === 0) {
          stockOut += entry.quantity_changed;
        }
      });
  
      const currentStock = stockIn - stockOut;
      res.json({ currentStock });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong!' });
    }
  };
  
  //production process update 
  exports.updateProductionProcess = async (req, res) => {
    try {
      const {
        production_id,
        rawMaterials,
        childRawMaterials,
        alternateRawMaterials,
        finishedGoods,
        scrapMaterials,
        routingData,
        production
      } = req.body;
      const userId = req.user.id;
      const companyId = req.user.company_id;
      const referenceNumber = await generateUniqueReferenceNumber();
      // Update Raw Materials
      if (rawMaterials && rawMaterials.length > 0) {
        for (const item of rawMaterials) {
          await ProductionRawMaterial.update(
            {
              product_id: item.product_id,
              //quantity: item.inputQuantity,
              usedRM: item.usedRM,
              comment: item.comment,
              store_id: item.store_id,
              addLess: item.addLess,
            },
            { where: { id: item.id } }
          );
          productDetails = await Product.findOne({ where: { id: item.product_id } });
          // Track Raw Material Stock OUT
          if (item.inputQuantity) {
          await TrackProductStock.create({
            product_id: item.product_id,
            item_name: productDetails.product_name || "", // Optional if available
            store_id: item.store_id,
            reference_number: "INV" + referenceNumber,
            barcode_number: generateRandomBarcode(),
            quantity_changed: item.inputQuantity,
            final_quantity: item.final_quantity || 0, // optional, or fetch updated stock
            default_price: productDetails.product_price || 0,
            comment: item.comment || "Issued for production",
            item_unit: item.item_unit || "",
            adjustmentType: "Production Raw Material Used",
            status_in_out: 0, // OUT
            user_id: userId,
            company_id: companyId
            
          });
        }
        }
      }
  
      //  Update Finished Goods
      if (finishedGoods && finishedGoods.length > 0) {
        for (const fg of finishedGoods) {
          await ProductionFinishedGoods.update(
            {
              completed: fg.completed,
              tested: fg.tested,
              passed: fg.passed,
              comment: fg.comment,
            },
            { where: { id: fg.id } }
          );
        }
      }
  
      // Update Scrap Materials
      if (scrapMaterials && scrapMaterials.length > 0) {
        for (const sc of scrapMaterials) {
          await ProductionScrapItems.update(
            {
              actualquantity: sc.actualquantity,
              comment: sc.comment,
            },
            { where: { id: sc.id } }
          );
        }
      }
  
      // Update Routing Data
      if (routingData && routingData.length > 0) {
        for (const rt of routingData) {
          await ProductionRouteProcess.update(
            {
              comment: rt.comment,
              current_fg_qty: rt.current_fg_qty,
              change_fg_qty: rt.change_fg_qty,
              completion: rt.completion,
              mark_done: rt.mark_done,
            },
            { where: { id: rt.id } }
          );
        }
      }
  
      // Update Production Charges
      if (production && production.id) {
        await Production.update(
          {
            labourChargesAA: production.labourChargesAA,
            labourCharges_comment: production.labourCharges_comment,
            machineryChargesAA: production.machineryChargesAA,
            machineryCharges_comment: production.machineryCharges_comment,
            electricityChargesAA: production.electricityChargesAA,
            electricityCharges_comment: production.electricityCharges_comment,
            otherChargesAA: production.otherChargesAA,
            otherCharges_comment: production.otherCharges_comment,
            status: 2,
            is_action:'process'
          },
          { where: { id: production.id } }
        );
        await PurchaseProduct.update(
            { production_status: 2, }, 
            { where: { production_number: production.production_number } }
        )
      }

  
      res.status(200).json({ message: 'Production process updated successfully.', pid: production.id });
    } catch (err) {
      console.error('Error updating production process:', err);
      res.status(500).json({ error: 'Failed to update production process.' });
    }
};
  
 