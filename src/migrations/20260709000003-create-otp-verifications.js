'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('otp_verifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      phone: { type: Sequelize.STRING, allowNull: false },
      otpCode: { type: Sequelize.STRING, allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
      isUsed: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('otp_verifications');
  },
};