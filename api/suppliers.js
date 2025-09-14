suppliersDB.ensureIndex({ fieldName: "_id", unique: true });

/**
 * POST endpoint: Create or update a supplier
 */
app.post("/supplier", function (req, res) {
    // For now, we'll skip file upload for suppliers unless needed
    let supplierData = {
        _id: parseInt(validator.escape(req.body.id)) || Math.floor(Date.now() / 1000),
        name: validator.escape(req.body.supplierName),
        contact: validator.escape(req.body.contactInfo),
        email: validator.escape(req.body.email),
        address: validator.escape(req.body.address),
        goodsSupplied: validator.escape(req.body.goodsSupplied),
        paymentTerms: validator.escape(req.body.paymentTerms),
        paymentDueDate: validator.escape(req.body.paymentDueDate),
        paymentStatus: validator.escape(req.body.paymentStatus),
        paymentAmount: parseFloat(validator.escape(req.body.paymentAmount)) || 0,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Log the data to console as requested
    console.log("Supplier Form Data:", supplierData);

    if (req.body.id && req.body.id !== "") {
        // Update existing supplier
        suppliersDB.update(
            { _id: parseInt(validator.escape(req.body.id)) },
            { $set: supplierData },
            {},
            function (err, numReplaced) {
                if (err) {
                    console.error("Error updating supplier:", err);
                    res.status(500).json({
                        error: "Internal Server Error",
                        message: "Failed to update supplier",
                    });
                } else {
                    console.log("Supplier updated successfully");
                    res.status(200).json({
                        message: "Supplier updated successfully",
                        id: supplierData._id
                    });
                }
            }
        );
    } else {
        // Insert new supplier
        suppliersDB.insert(supplierData, function (err, newSupplier) {
            if (err) {
                console.error("Error creating supplier:", err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "Failed to create supplier",
                });
            } else {
                console.log("Supplier created successfully with ID:", newSupplier._id);
                res.status(200).json({
                    message: "Supplier created successfully",
                    id: newSupplier._id
                });
            }
        });
    }
});

/**
 * GET endpoint: Get all suppliers
 */
app.get("/suppliers", function (req, res) {
    suppliersDB.find({}).sort({ name: 1 }).exec(function (err, docs) {
        if (err) {
            console.error("Error fetching suppliers:", err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to fetch suppliers",
            });
        } else {
            res.send(docs);
        }
    });
});

/**
 * GET endpoint: Get supplier by ID
 */
app.get("/supplier/:supplierId", function (req, res) {
    if (!req.params.supplierId) {
        res.status(400).send("Supplier ID is required.");
    } else {
        suppliersDB.findOne(
            { _id: parseInt(req.params.supplierId) },
            function (err, supplier) {
                if (err) {
                    console.error("Error fetching supplier:", err);
                    res.status(500).json({
                        error: "Internal Server Error",
                        message: "Failed to fetch supplier",
                    });
                } else if (!supplier) {
                    res.status(404).send("Supplier not found");
                } else {
                    res.send(supplier);
                }
            }
        );
    }
});

/**
 * DELETE endpoint: Delete a supplier by ID
 */
app.delete("/supplier/:supplierId", function (req, res) {
    suppliersDB.remove(
        { _id: parseInt(req.params.supplierId) },
        function (err, numRemoved) {
            if (err) {
                console.error("Error deleting supplier:", err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "Failed to delete supplier",
                });
            } else if (numRemoved === 0) {
                res.status(404).send("Supplier not found");
            } else {
                res.sendStatus(200);
            }
        }
    );
});