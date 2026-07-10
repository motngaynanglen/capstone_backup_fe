export const staffOrders = [
  {
    id: 'ORD001',
    customerName: 'Nguyễn Văn A',
    createdAt: '2026-01-15',
    items: [
      {
        id: 'ITEM001',
        name: 'Phone Stand',
        type: 'normal',
        quantity: 2,
        material: 'PLA',
        status: 'Pending',
      },
      {
        id: 'ITEM002',
        name: 'Custom Gear',
        type: 'custom_file',
        quantity: 1,
        material: 'ABS',
        status: 'Waiting for Approval',
        customerFile: 'gear.stl',
      },
      {
        id: 'ITEM003',
        name: 'Mini Figure',
        type: 'custom_design',
        quantity: 1,
        material: 'Resin',
        status: 'Designing',
        designVersions: [
          {
            version: 1,
            file: 'v1.stl',
            note: 'Initial concept',
            approved: false,
          },
        ],
        feedbacks: [
          {
            from: 'customer',
            message: 'Make the head bigger',
            date: '2026-01-16',
          },
        ],
      },
    ],
  },
];
